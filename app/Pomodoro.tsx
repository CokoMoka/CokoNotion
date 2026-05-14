// app/pomodoro-timer.tsx
import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Image, 
  Text, 
  StyleSheet, 
  Dimensions, 
  SafeAreaView, 
  TouchableOpacity, 
  Animated, 
  Vibration, 
  Alert,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTimerStats } from "@/hooks/useTimerStats";
import { useUser } from "@/hooks/useUser";
import { getUserAvatar, getUserBanner, getUserBackground, getUserCover } from "../services/avatarService";
import { AppImages } from "@/constants/images";
import { Audio } from 'expo-av';
import { useGyroscope } from '@/hooks/usePomodoroGyro';

const { width, height } = Dimensions.get("window");

const PomodoroTimerScreen = () => {
  const { selectedTime } = useLocalSearchParams();
  const initialTime = selectedTime ? parseInt(selectedTime as string) : 25;
  
  const { addPomodoro, addBreak } = useTimerStats();
  const { user, loading: userLoading } = useUser();
  
  // Estados para imágenes del usuario
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);
  
  const [timeLeft, setTimeLeft] = useState(initialTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  // 🔥 Estado para hint del giroscopio
  const [showGyroHint, setShowGyroHint] = useState(true);
  
  // Referencias para sonidos
  const studySoundRef = useRef<Audio.Sound | null>(null);
  const breakSoundRef = useRef<Audio.Sound | null>(null);
  
  // Control para evitar múltiples transiciones
  const transitioningRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Cargar imágenes y sonidos
  useEffect(() => {
    if (user?.uid) {
      cargarImagenes();
      cargarSonidos();
    }
    
    return () => {
      if (studySoundRef.current) {
        studySoundRef.current.unloadAsync();
      }
      if (breakSoundRef.current) {
        breakSoundRef.current.unloadAsync();
      }
    };
  }, [user]);

  // 🔥 HOOK DEL GIROSCOPIO
  const { isAvailable: gyroAvailable } = useGyroscope({
    enabled: isActive,
    onLeftTilt: () => {
      Vibration.vibrate(100);
      setIsActive(false);
      // Alert.alert('⏸️ Pausado', 'Has inclinado el teléfono hacia la izquierda', [], 1500);
    },
    onRightTilt: () => {
      Vibration.vibrate(100);
      Alert.alert(
        "🙉 ¿Saltar este período?",
        mode === 'focus' ? "¡Saltarás a la siguiente fase!" : "¿Quieres saltarte este descanso?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Saltar", style: "destructive", onPress: async () => {
            setIsActive(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            await transitionToNextPhase();
          }}
        ]
      );
    },
    onFlat: () => {
      if (!isActive && timeLeft > 0 && timeLeft < (mode === 'focus' ? initialTime * 60 : 5 * 60)) {
        Vibration.vibrate(50);
        setIsActive(true);
        Alert.alert('🐒 Reanudado', 'Teléfono en posición horizontal', [], 1000);
      }
    },
    threshold: 2.5,
    timeout: 800,
  });

  const cargarImagenes = async () => {
    if (!user?.uid) return;
    setLoadingImages(true);
    
    try {
      const [cover, background] = await Promise.all([
        getUserCover(user.uid),
        getUserBackground(user.uid),
      ]);
      
      setCoverUrl(cover);
      setBackgroundUrl(background);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const cargarSonidos = async () => {
    try {
      const { sound: studySound } = await Audio.Sound.createAsync(
        require('../assets/sounds/study.mp3')
      );
      studySoundRef.current = studySound;
      
      const { sound: breakSound } = await Audio.Sound.createAsync(
        require('../assets/sounds/break.mp3')
      );
      breakSoundRef.current = breakSound;
      
      console.log('✅ Sonidos cargados correctamente');
    } catch (error) {
      console.error('Error al cargar sonidos:', error);
    }
  };

  const playSound = async (tipo: 'study' | 'break') => {
    try {
      const sound = tipo === 'study' ? studySoundRef.current : breakSoundRef.current;
      if (sound) {
        await sound.replayAsync();
      }
    } catch (error) {
      console.error('Error al reproducir sonido:', error);
    }
  };

  const vibrate = () => {
    Vibration.vibrate(500);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalTime = mode === 'focus' ? initialTime * 60 : 5 * 60;
  const progress = (totalTime - timeLeft) / totalTime;

  const animateScale = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, tension: 40, friction: 3 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 3 }),
    ]).start();
  };

  const transitionToNextPhase = async () => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;
    
    try {
      if (mode === 'focus') {
        console.log('🍅 Estudio completado');
        vibrate();
        await addPomodoro(initialTime);
        
        setCompletedPomodoros(prev => prev + 1);
        setMode('break');
        setTimeLeft(5 * 60);
        
        await playSound('break');
        
      } else {
        console.log('☕ Descanso completado');
        vibrate();
        await addBreak();
        
        setMode('focus');
        setTimeLeft(initialTime * 60);
        
        await playSound('study');
      }
      
      animateScale();
      setIsActive(true);
      
    } catch (error) {
      console.error('Error en transición:', error);
    } finally {
      transitioningRef.current = false;
    }
  };

  useEffect(() => {
    if (isActive && !transitioningRef.current) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            transitionToNextPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, mode, initialTime]);

  const handleStart = () => {
    setIsActive(true);
    playSound('study');
  };
  
  const handlePause = () => {
    setIsActive(false);
  };

  const handleResetWithAlert = () => {
    if (isActive) {
      setIsActive(false);
    }
    Alert.alert(
      "🙊 ¿Salir del temporizador?",
      "Si sales, perderás el progreso de este pomodoro.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: () => router.back() }
      ]
    );
  };

  const handleSkipWithAlert = () => {
    Alert.alert(
      "🙉 ¿Saltar este período?",
      mode === 'focus' ? "Saltarás a la siguiente fase del pomodoro actual." : "¿Quieres saltarte este descanso?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Saltar", style: "destructive", onPress: async () => {
          setIsActive(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          await transitionToNextPhase();
        }}
      ]
    );
  };

  if (userLoading || loadingImages) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#df96c0" />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ImageBackground
        source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.content}>
              
              {coverUrl ? (
                <Image
                  source={{ uri: coverUrl }}
                  resizeMode="cover"
                  style={styles.bannerImage}
                />
              ) : (
                <Image
                  source={AppImages.cover}
                  resizeMode="contain"
                  style={styles.bannerImage}
                />
              )}
              
              <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{timeString}</Text>
                <Text style={styles.counterText}>#{completedPomodoros + 1}</Text>
              </View>

              <View style={styles.progressWrapper}>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                </View>
              </View>
              
              <View style={styles.controlsContainer}>
                <TouchableOpacity onPress={handleResetWithAlert}>
                  <Image source={require('../assets/images/end.png')} resizeMode="contain" style={styles.controlButton} />
                </TouchableOpacity>
                
                {!isActive ? (
                  <TouchableOpacity onPress={handleStart}>
                    <Image source={require('../assets/images/Play.png')} resizeMode="contain" style={styles.playButton} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={handlePause}>
                    <Image source={require('../assets/images/Stop.png')} resizeMode="contain" style={styles.playButton} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={handleSkipWithAlert}>
                  <Image source={require('../assets/images/next.png')} resizeMode="contain" style={styles.controlButton} />
                </TouchableOpacity>
              </View>

            

              {/* Indicador del ciclo actual */}
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  {mode === 'focus' ? '𓍢ִ໋🀦  Modo Estudio' : '☕︎  Modo Descanso'}
                </Text>
                
              </View>
              
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  fullScreenBackground: { flex: 1, width: '100%', height: '100%', backgroundColor: '#000000' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.77)' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#FFFFFF' },
  content: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: height * 0.15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerImage: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.03,
    marginBottom: height * 0.02,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: width * 0.01,
    marginBottom: height * 0.02,
    marginTop: height * -0.01,
    width: width * 0.8,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: width * 0.12,
    fontWeight: "bold",
    textAlign: "left",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  counterText: {
    color: "#df96c0",
    fontSize: width * 0.07,
    fontWeight: "bold",
    textAlign: "right",
  },
  progressWrapper: {
    alignItems: "center",
    marginBottom: 0,
    width: width * 0.8,
    marginTop: -10
  },
  progressBarBackground: {
    width: "100%",
    height: 8,
    backgroundColor: "#3E3E3E",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#df96c0",
    borderRadius: 4,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: width * 0.1,
    marginBottom: height * 0.7,
    marginTop: height * 0.1
  },
  controlButton: {
    width: width * 0.22,
    height: width * 0.28,
  },
  playButton: {
    width: width * 0.28,
    height: width * 0.28,
  },
  statusContainer: {
    position: 'absolute',
    bottom: height * 0.87,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.8,
  },
  gyroIndicator: {
    fontSize: 16,
  },
  gyroHint: {
    position: 'absolute',
    bottom: height * 0.25,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#df96c0',
    width: width * 0.8,
  },
  gyroHintTitle: {
    color: '#df96c0',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  gyroHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    marginVertical: 2,
  },
  gyroHintClose: {
    color: '#888888',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default PomodoroTimerScreen;