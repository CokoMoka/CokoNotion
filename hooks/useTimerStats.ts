// hooks/useTimerStats.ts
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './useUser';
import { updateUserStats, getUserData } from '../services/auth';

interface TimerSession {
    duration: number;
    timestamp: string;
    type: 'focus' | 'break';
}

interface LocalTimerStats {
    sessions: TimerSession[];
    todayPomodoros: number;
    todayMinutes: number;
    todayBreaks: number;
    lastSyncDate: string;
}

export const useTimerStats = () => {
    const { user, loading: userLoading, refreshUser } = useUser();

    const [localStats, setLocalStats] = useState<LocalTimerStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const processingRef = useRef(false);

    const getTodayString = (): string => {
        return new Date().toISOString().split('T')[0];
    };

    useEffect(() => {
        if (!userLoading && user) {
            loadLocalStats();
        }
    }, [userLoading, user]);

    const loadLocalStats = async () => {
        if (!user?.uid) return;
        try {
            const key = `timerStats_${user.uid}`;
            const saved = await AsyncStorage.getItem(key);
            const today = getTodayString();
            
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.lastSyncDate !== today) {
                    const newStats = {
                        sessions: [],
                        todayPomodoros: 0,
                        todayMinutes: 0,
                        todayBreaks: 0,
                        lastSyncDate: today,
                    };
                    setLocalStats(newStats);
                    await AsyncStorage.setItem(key, JSON.stringify(newStats));
                } else {
                    setLocalStats(parsed);
                }
            } else {
                const newStats = {
                    sessions: [],
                    todayPomodoros: 0,
                    todayMinutes: 0,
                    todayBreaks: 0,
                    lastSyncDate: today,
                };
                setLocalStats(newStats);
                await AsyncStorage.setItem(key, JSON.stringify(newStats));
            }
        } catch (error) {
            console.error('Error loading local stats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveLocalStats = async (newStats: LocalTimerStats) => {
        if (!user?.uid) return;
        setLocalStats(newStats);
        const key = `timerStats_${user.uid}`;
        await AsyncStorage.setItem(key, JSON.stringify(newStats));
    };

    // 🔥 FUNCIÓN DE SINCRONIZACIÓN
    const syncToFirestore = async () => {
        if (!user?.uid || !localStats) return;
        
        try {
            const today = getTodayString();
            const userData = await getUserData(user.uid);
            
            const minutosActualesHoy = userData?.minutosEstudioHoy || 0;
            const pomodorosActualesHoy = userData?.pomodorosHoy || 0;
            const horasActuales = userData?.horasEstudio || 0;
            
            // Solo sincronizar si hay cambios
            if (localStats.todayMinutes === minutosActualesHoy && 
                localStats.todayPomodoros === pomodorosActualesHoy) {
                return;
            }
            
            const incrementoMinutos = localStats.todayMinutes - minutosActualesHoy;
            const incrementoPomodoros = localStats.todayPomodoros - pomodorosActualesHoy;
            
            const nuevasHoras = horasActuales + (incrementoMinutos / 60);
            const nuevosTotalPomodoros = (userData?.totalPomodoros || 0) + incrementoPomodoros;
            
            await updateUserStats(user.uid, {
                horasEstudio: nuevasHoras,
                minutosEstudioHoy: localStats.todayMinutes,
                pomodorosHoy: localStats.todayPomodoros,
                totalPomodoros: nuevosTotalPomodoros,
                ultimoDiaEstudio: today,
            });
            
            console.log('✅ Stats sincronizadas con Firestore');
            await refreshUser();
        } catch (error) {
            console.error('Error syncing to Firestore:', error);
        }
    };

    // 🔥 Agregar pomodoro
    const addPomodoro = async (minutes: number) => {
        if (processingRef.current) {
            console.log('⏳ Procesando...');
            return;
        }
        
        if (!user?.uid) {
            console.warn('No hay usuario');
            return;
        }
        
        if (isLoading || !localStats) {
            console.log('⏳ Esperando stats...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (!localStats) {
                console.error('❌ Stats no cargados');
                return;
            }
        }

        processingRef.current = true;
        
        try {
            const today = getTodayString();
            
            const newSession: TimerSession = {
                duration: minutes,
                timestamp: new Date().toISOString(),
                type: 'focus',
            };
            
            let nuevosPomodoros = localStats.todayPomodoros + 1;
            let nuevosMinutos = localStats.todayMinutes + minutes;
            let nuevasSessions = [newSession, ...localStats.sessions].slice(0, 50);
            let nuevaFecha = localStats.lastSyncDate;
            
            if (localStats.lastSyncDate !== today) {
                console.log('🔄 Nuevo día detectado');
                nuevosPomodoros = 1;
                nuevosMinutos = minutes;
                nuevasSessions = [newSession];
                nuevaFecha = today;
            }
            
            const updatedStats: LocalTimerStats = {
                sessions: nuevasSessions,
                todayPomodoros: nuevosPomodoros,
                todayMinutes: nuevosMinutos,
                todayBreaks: localStats.todayBreaks,
                lastSyncDate: nuevaFecha,
            };
            
            console.log(`➕ Pomodoro: +${minutes} min, Total hoy: ${updatedStats.todayMinutes} min`);
            
            await saveLocalStats(updatedStats);
            await syncToFirestore();
            
        } catch (error) {
            console.error('Error en addPomodoro:', error);
        } finally {
            processingRef.current = false;
        }
    };

    const addBreak = async () => {
        if (!user?.uid || !localStats) return;
        
        const today = getTodayString();
        
        let nuevosBreaks = localStats.todayBreaks + 1;
        let nuevasSessions = [...localStats.sessions];
        let nuevaFecha = localStats.lastSyncDate;
        
        if (localStats.lastSyncDate !== today) {
            nuevosBreaks = 1;
            nuevaFecha = today;
        }
        
        const newSession: TimerSession = {
            duration: 5,
            timestamp: new Date().toISOString(),
            type: 'break',
        };
        
        nuevasSessions = [newSession, ...nuevasSessions].slice(0, 50);
        
        const updatedStats: LocalTimerStats = {
            ...localStats,
            sessions: nuevasSessions,
            todayBreaks: nuevosBreaks,
            lastSyncDate: nuevaFecha,
        };
        
        await saveLocalStats(updatedStats);
    };

    const resetDailyStats = async () => {
        const today = getTodayString();
        const resetStats: LocalTimerStats = {
            sessions: [],
            todayPomodoros: 0,
            todayMinutes: 0,
            todayBreaks: 0,
            lastSyncDate: today,
        };
        await saveLocalStats(resetStats);
        await syncToFirestore();
    };

    // 🔥 Función forceSync pública
    const forceSync = async () => {
        await syncToFirestore();
    };

    return {
        stats: {
            todayPomodoros: localStats?.todayPomodoros || 0,
            todayMinutes: localStats?.todayMinutes || 0,
            todayBreaks: localStats?.todayBreaks || 0,
            totalPomodoros: user?.totalPomodoros || 0,
            totalHoras: user?.horasEstudio || 0,
            racha: user?.racha || 0,
            sessions: localStats?.sessions || [],
        },
        addPomodoro,
        addBreak,
        resetDailyStats,
        forceSync,  
        isLoading: userLoading || isLoading,
    };
};