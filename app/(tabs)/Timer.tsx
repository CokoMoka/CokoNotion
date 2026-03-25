import React, { useState, useRef, useEffect } from 'react';
import {
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Vibration,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { Colors, getFontFamily } from '../../constants/theme';

const { width } = Dimensions.get('window');

const TimerScreen = () => {
  const [selectedTime, setSelectedTime] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // en segundos
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [breakCount, setBreakCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const timeOptions = [25, 30, 45, 60];
  const breakOptions = [5, 10, 15];
  
  // Estadísticas simuladas (conectar con base de datos real)
  const [pomodorosToday, setPomodorosToday] = useState(2);
  const [totalTimeToday, setTotalTimeToday] = useState(50); // minutos
  const [breaksToday, setBreaksToday] = useState(3);

  const theme = Colors.light;
  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const minutos = Math.floor(timeLeft / 60);
  const segundos = timeLeft % 60;
  const minutosStr = minutos.toString().padStart(2, '0');
  const segundosStr = segundos.toString().padStart(2, '0');
  const progress = mode === 'focus' 
    ? (selectedTime * 60 - timeLeft) / (selectedTime * 60)
    : (5 * 60 - timeLeft) / (5 * 60);

  // Efecto de animación al cambiar el tiempo
  const animateTimeChange = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 40,
        friction: 3,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 3,
      }),
    ]).start();
  };

  // Efecto al completar un pomodoro
  const handleComplete = () => {
    Vibration.vibrate(500);
    if (mode === 'focus') {
      setCompletedPomodoros(prev => prev + 1);
      setPomodorosToday(prev => prev + 1);
      setTotalTimeToday(prev => prev + selectedTime);
      setMode('break');
      setTimeLeft(5 * 60); // 5 minutos de descanso
    } else {
      setBreakCount(prev => prev + 1);
      setBreaksToday(prev => prev + 1);
      setMode('focus');
      setTimeLeft(selectedTime * 60);
    }
    animateTimeChange();
  };

  // Lógica del temporizador
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsActive(false);
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // Sincronizar tiempo cuando cambia selectedTime
  useEffect(() => {
    if (!isActive && mode === 'focus') {
      setTimeLeft(selectedTime * 60);
      animateTimeChange();
    }
  }, [selectedTime]);

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(selectedTime * 60);
    }
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    if (mode === 'focus') {
      setTimeLeft(selectedTime * 60);
    } else {
      setTimeLeft(5 * 60);
    }
    animateTimeChange();
  };

  const handleSkip = () => {
    setIsActive(false);
    handleComplete();
  };

  const getModeColor = () => {
    return mode === 'focus' ? theme.bearAccent : theme.bearSecondary;
  };

  const getModeLabel = () => {
    return mode === 'focus' ? 'Enfoque' : 'Descanso';
  };

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={require('../../assets/images/bD.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                
                {/* Header con modo actual */}
                <View style={styles.header}>
                  <View style={[styles.modeBadge, { backgroundColor: getModeColor() + '20' }]}>
                    <Text style={[styles.modeText, { color: getModeColor() }, font('sans')]}>
                      {getModeLabel()}
                    </Text>
                  </View>
                  <Text style={[styles.pomodoroCount, { color: theme.textSecondary }, font('sans')]}>
                    #{completedPomodoros + 1}
                  </Text>
                </View>

                {/* Temporizador principal - estilo iOS */}
                <View style={styles.timerContainer}>
                  <View style={styles.timerWrapper}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                      style={styles.timerGlow}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    />
                    <Animated.View 
                      style={[
                        styles.timerDisplay,
                        { transform: [{ scale: scaleAnim }] }
                      ]}
                    >
                      <View style={styles.timeDigits}>
                        <Text style={[styles.timeDigit, { color: theme.text }, font('mono')]}>
                          {minutosStr}
                        </Text>
                        <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>
                        <Text style={[styles.timeDigit, { color: theme.text }, font('mono')]}>
                          {segundosStr}
                        </Text>
                      </View>
                      
                      {/* Barra de progreso circular (opcional) */}
                      <View style={styles.progressRing}>
                        <View 
                          style={[
                            styles.progressFill,
                            { 
                              width: `${progress * 100}%`,
                              backgroundColor: getModeColor()
                            }
                          ]} 
                        />
                      </View>
                    </Animated.View>
                  </View>
                </View>

                {/* Selector de tiempo - estilo iOS */}
                <View style={styles.timeSelectorContainer}>
                  <Text style={[styles.selectorLabel, { color: theme.textSecondary }, font('sans')]}>
                    Duración
                  </Text>
                  <View style={styles.timeOptions}>
                    {timeOptions.map((time) => (
                      <TouchableOpacity
                        key={time}
                        style={[
                          styles.timeOption,
                          
                          !isActive && { opacity: 1 }
                        ]}
                        onPress={() => !isActive && setSelectedTime(time)}
                        disabled={isActive}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            { color: selectedTime === time ? '#ffffff' : theme.textSecondary },
                            font('rounded'),
                          ]}
                        >
                          {time}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Botones de control - estilo iOS */}
                <View style={styles.controlsContainer}>
                  {!isActive ? (
                    <TouchableOpacity 
                      style={[styles.primaryButton, { backgroundColor: theme.bearPrimary }]}
                      onPress={handleStart}
                    >
                      <Text style={[styles.primaryButtonText, { color: '#ffffff' }, font('rounded')]}>
                        Iniciar
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.primaryButton, { backgroundColor: theme.bearLight }]}
                      onPress={handlePause}
                    >
                      <Text style={[styles.primaryButtonText, { color: '#ffffff' }, font('rounded')]}>
                        Pausar
                      </Text>
                    </TouchableOpacity>
                  )}
                  
                  <View style={styles.secondaryButtons}>
                    <TouchableOpacity 
                      style={styles.secondaryButton}
                      onPress={handleReset}
                    >
                      <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }, font('sans')]}>
                        Reiniciar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.secondaryButton}
                      onPress={handleSkip}
                    >
                      <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }, font('sans')]}>
                        Saltar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Estadísticas - estilo iOS cards */}
                <View style={styles.statsSection}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }, font('sans')]}>
                    Hoy
                  </Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                      <Text style={[styles.statEmoji, { color: getModeColor() }]}>🌺</Text>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {pomodorosToday}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        Pomodoros
                      </Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={[styles.statEmoji, { color: getModeColor() }]}>⏱️</Text>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {totalTimeToday}min
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        Tiempo total
                      </Text>
                    </View>
                    
                    <View style={styles.statCard}>
                      <Text style={[styles.statEmoji, { color: getModeColor() }]}>🧘</Text>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {breaksToday}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        Descansos
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Frase motivacional */}
                <View style={styles.quoteCard}>
                  <Text style={[styles.quoteText, { color: theme.textSecondary }, font('sans')]}>
                    "La constancia es más importante que la intensidad"
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: getModeColor() }, font('rounded')]}>
                    — Pomodoro
                  </Text>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pomodoroCount: {
    fontSize: 14,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  timerGlow: {
    position: 'absolute',
    width: width - 80,
    height: width - 80,
    borderRadius: (width - 80) / 2,
    opacity: 0.3,
  },
  timerDisplay: {
    alignItems: 'center',
  },
  timeDigits: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  timeDigit: {
    fontSize: 72,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 4,
  },
  timeSeparator: {
    fontSize: 72,
    fontWeight: '300',
    marginHorizontal: 8,
  },
  progressRing: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeSelectorContainer: {
    marginBottom: 32,
  },
  selectorLabel: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  timeOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  timeOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  timeOptionText: {
    fontSize: 18,
    fontWeight: '500',
  },
  controlsContainer: {
    marginBottom: 32,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF9F4A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  quoteCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  quoteText: {
    fontSize: 15,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TimerScreen;