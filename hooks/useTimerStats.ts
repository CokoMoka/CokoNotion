import { useState, useEffect, use } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from './useUser'; // Asumo que ya tienes este hook
import { updateUserStats, getUserData } from '../services/auth';

interface TimerSession {
    duration: number; // Duración total en minutos
    timestamp: string;
    type: 'focus' | 'break';
}

interface LocalTimerStats {
    sessions: TimerSession[];
    todayPomodoros: number;
    todayMinutes: number;
    todayBreaks: number;
    lastSyncDate: string; //YYYY-MM-DD

}

export const useTimerStats = () => {
    const {user, firebaseUser, loading: userLoading} = useUser();

    const [localStats, setLocalStats] = useState<LocalTimerStats>({
        sessions: [],
        todayPomodoros: 0,
        todayMinutes: 0,
        todayBreaks: 0,
        lastSyncDate: new Date().toISOString().split('T')[0], // Solo la fecha
    })

    const [pendingSync, setPendingSync] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!userLoading && firebaseUser) {
            loadLocalStats();
        }
    }, [userLoading, firebaseUser]);

    useEffect(() => {
        const interval = setInterval(() => {
            if(pendingSync && firebaseUser) {
                syncToFirestore();
            }
        }, 30000); // Cada 30 segundos
        return () => clearInterval(interval);
    }, [pendingSync, firebaseUser]);

    useEffect(() => {
       const {AppState} = require('react-native');
       const subscription = AppState.addEventListener('change', (nextAppState:string) => {
        if(nextAppState === 'background' && pendingSync && firebaseUser) {
            syncToFirestore();
        }
        });
        return () => subscription.remove();
    }, [pendingSync, firebaseUser]);

    const loadLocalStats = async () => {
        if (!firebaseUser) return;
        try{
            const key = `timerStats_${firebaseUser.uid}`;
            const saved = await AsyncStorage.getItem(key);
            if(saved) {
                const parsed = JSON.parse(saved);
                const today = new Date().toISOString().split('T')[0];
                if(parsed.lastSyncDate !== today) {
                    parsed.todayPomodoros = 0;
                    parsed.todayMinutes = 0;
                    parsed.todayBreaks = 0;
                    parsed.sessions = [];
                    parsed.lastSyncDate = today;
                }
                setLocalStats(parsed);
            }
        } catch (error) {
            console.error('Error loading local stats:', error);

        } finally {
            setIsLoading(false);
        }
    };

    const saveLocalStats = async (newStats: LocalTimerStats) => {
        if (!firebaseUser) return;
        setLocalStats(newStats);
        setPendingSync(true);

        const key = `timerStats_${firebaseUser.uid}`;
        await AsyncStorage.setItem(key, JSON.stringify(newStats));
    };
    
const syncToFirestore = async () => {
    if (!firebaseUser || !pendingSync) return;
    // Si no hay usuario O no hay cambios pendientes, salir
    
    try {
      const today = new Date().toISOString().split('T')[0];  // Fecha actual
      
      // Obtener horas actuales del usuario (de Firestore)
      const horasEstudioActuales = user?.horasEstudio || 0;
      // user?.horasEstudio: si user existe, toma horasEstudio, si no, 0
      
      const minutosAgregadosHoy = localStats.todayMinutes;  // Ej: 75
      const totalHoras = horasEstudioActuales + (minutosAgregadosHoy / 60);
      // Convierte minutos a horas (75 / 60 = 1.25) y suma
      
      // ========================================
      // LÓGICA DE RACHA (días consecutivos)
      // ========================================
      let nuevaRacha = user?.racha || 0;  // Empieza con la racha actual
      
      // Buscar último día que estudió
      const lastStudyDate = await AsyncStorage.getItem(`lastStudyDate_${firebaseUser.uid}`);
      
      if (localStats.todayPomodoros > 0) {  // Si estudió hoy
        if (lastStudyDate === today) {
          // Ya estudió hoy → no cambia la racha
          // (evita contar dos veces el mismo día)
        } 
        else if (lastStudyDate === getYesterdayString()) {
          // Estudió ayer → aumenta racha en 1
          nuevaRacha += 1;
        } 
        else if (lastStudyDate !== today && lastStudyDate !== null) {
          // Hay una fecha guardada pero no es hoy ni ayer
          // → rompió la racha, empieza de nuevo
          nuevaRacha = 1;
        } 
        else if (lastStudyDate === null) {
          // Primera vez que estudia en toda la app
          nuevaRacha = 1;
        }
      }
      
      // ========================================
      // GUARDAR EN CLOUD (Firestore)
      // ========================================
      // Usa tu función existente de auth.ts
      const result = await updateUserStats(firebaseUser.uid, {
        racha: nuevaRacha,           // Actualiza racha
        horasEstudio: totalHoras,    // Actualiza horas totales
      });
      
      if (result.success) {  // Si se guardó correctamente
        setPendingSync(false);  // Ya no hay cambios pendientes
        
        // Guardar que hoy estudió (para futuros cálculos de racha)
        await AsyncStorage.setItem(`lastStudyDate_${firebaseUser.uid}`, today);
        console.log('✅ Stats sincronizadas con Firestore');
      }
    } catch (error) {
      console.error('Error syncing to Firestore:', error);
      // Si hay error, pendingSync sigue en true para reintentar después
    }
  };

  // FUNCIÓN 4: Obtener fecha de ayer (formato YYYY-MM-DD)
  const getYesterdayString = (): string => {
    const yesterday = new Date();        // Fecha/hora actual
    yesterday.setDate(yesterday.getDate() - 1);  // Resta 1 día
    // getDate(): día del mes (ej: 2)
    // setDate(1): cambia al día 1
    
    return yesterday.toISOString().split('T')[0];  // "2026-05-01"
  };

  // ============================================
  // 3.4 FUNCIONES QUE USA EL COMPONENTE (Timer.tsx)
  // ============================================

  // FUNCIÓN 5: Agregar un pomodoro completado
  const addPomodoro = async (minutes: number) => {
    // minutes: ej 25 (duración del pomodoro)
    if (!firebaseUser) {
      console.warn('No hay usuario autenticado');
      return;
    }

    const today = new Date().toISOString().split('T')[0];  // Fecha actual
    const updatedStats = { ...localStats };  
    // { ...localStats } = "spread operator"
    // Crea una COPIA del objeto (para no modificar el original directamente)
    
    // VERIFICAR SI ES UN NUEVO DÍA
    if (updatedStats.lastSyncDate !== today) {
      // Si la última fecha no es hoy, reiniciamos contadores
      updatedStats.todayPomodoros = 0;
      updatedStats.todayMinutes = 0;
      updatedStats.todayBreaks = 0;
      updatedStats.lastSyncDate = today;
    }
    
    // CREAR NUEVA SESIÓN
    const newSession: TimerSession = {
      duration: minutes,                    // Ej: 25
      timestamp: new Date().toISOString(), // "2026-05-02T15:30:00Z"
      type: 'focus',                       // Es de enfoque
    };
    
    // AGREGAR AL INICIO DEL ARRAY
    updatedStats.sessions = [newSession, ...updatedStats.sessions];
    // [nueva, ...antiguas] = nueva al principio, luego las antiguas
    
    // LIMITAR A 50 SESIONES (para no llenar memoria)
    updatedStats.sessions = updatedStats.sessions.slice(0, 50);
    // slice(0, 50) = toma desde posición 0 hasta 50 (primeros 50 elementos)
    
    // ACTUALIZAR CONTADORES
    updatedStats.todayPomodoros += 1;   // Suma 1
    updatedStats.todayMinutes += minutes;  // Suma los minutos
    
    // GUARDAR
    await saveLocalStats(updatedStats);
  };

  // FUNCIÓN 6: Agregar un descanso completado
  const addBreak = async () => {
    if (!firebaseUser) return;
    
    const today = new Date().toISOString().split('T')[0];
    const updatedStats = { ...localStats };  // Copia
    
    // Verificar si es nuevo día
    if (updatedStats.lastSyncDate !== today) {
      updatedStats.todayPomodoros = 0;
      updatedStats.todayMinutes = 0;
      updatedStats.todayBreaks = 0;
      updatedStats.lastSyncDate = today;
    }
    
    // Sumar 1 al contador de descansos
    updatedStats.todayBreaks += 1;
    
    // Crear sesión de descanso
    const newSession: TimerSession = {
      duration: 5,                         // Los breaks son de 5 min
      timestamp: new Date().toISOString(),
      type: 'break',
    };
    
    updatedStats.sessions = [newSession, ...updatedStats.sessions].slice(0, 50);
    await saveLocalStats(updatedStats);
  };

  // FUNCIÓN 7: Resetear estadísticas del día (útil para pruebas)
  const resetDailyStats = async () => {
    const updatedStats = { ...localStats };
    updatedStats.todayPomodoros = 0;
    updatedStats.todayMinutes = 0;
    updatedStats.todayBreaks = 0;
    updatedStats.lastSyncDate = new Date().toISOString().split('T')[0];
    
    await saveLocalStats(updatedStats);
  };

  // FUNCIÓN 8: Forzar sincronización manual
  const forceSync = () => {
    if (firebaseUser) {
      syncToFirestore();  // Sube datos ahora mismo
    }
  };

  // ============================================
  // 3.5 RETORNO - Lo que el componente puede usar
  // ============================================
  
  return {
    // Datos que el componente puede mostrar
    stats: {
      todayPomodoros: localStats.todayPomodoros,  // Pomodoros de hoy
      todayMinutes: localStats.todayMinutes,       // Minutos de hoy
      todayBreaks: localStats.todayBreaks,         // Descansos de hoy
      totalPomodoros: user?.totalPomodoros || 0,   // Total histórico
      totalHoras: user?.horasEstudio || 0,         // Horas totales
      racha: user?.racha || 0,                     // Racha actual
      sessions: localStats.sessions,               // Últimas sesiones
    },
    
    // Funciones que el componente puede llamar
    addPomodoro,      // Cuando completa un pomodoro
    addBreak,         // Cuando completa un descanso
    resetDailyStats,  // Para reiniciar (debug)
    forceSync,        // Para guardar manualmente
    
    // Estado de carga
    isLoading: userLoading || isLoading,  // true si algo está cargando
  };
};