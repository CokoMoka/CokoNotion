// app/pomodoro-timer.tsx
import React, { useState, useRef, useEffect } from "react";
import { View, Image, Text, StyleSheet, Dimensions, SafeAreaView, TouchableOpacity, Animated, Vibration, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useTimerStats } from "@/hooks/useTimerStats";

const { width, height } = Dimensions.get("window");

const PomodoroTimerScreen = () => {
  const { selectedTime } = useLocalSearchParams();
  const initialTime = selectedTime ? parseInt(selectedTime as string) : 25;
  
  const { addPomodoro, addBreak } = useTimerStats();
  
  const [timeLeft, setTimeLeft] = useState(initialTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Calcular tiempo formateado
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  // ✅ Calcular progreso (0 a 1)
  const totalTime = mode === 'focus' ? initialTime * 60 : 5 * 60;
  const progress = (totalTime - timeLeft) / totalTime;

  const animateScale = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true, tension: 40, friction: 3 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 40, friction: 3 }),
    ]).start();
  };

  const handleComplete = () => {
    Vibration.vibrate(500);
    if (mode === 'focus') {
      addPomodoro(initialTime);
      setCompletedPomodoros(prev => prev + 1);
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      addBreak();
      setMode('focus');
      setTimeLeft(initialTime * 60);
    }
    animateScale();
  };

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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isActive]);

  const handleStart = () => setIsActive(true);
  const handlePause = () => setIsActive(false);

  const handleResetWithAlert = () => {
    if (isActive) {
      setIsActive(false);
    }
    Alert.alert(
      "¿Salir del temporizador?",
      "Si sales, perderás el progreso de este pomodoro.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Salir", style: "destructive", onPress: () => router.back() }
      ]
    );
  };

  const handleSkipWithAlert = () => {
    Alert.alert(
      "¿Saltar este período?",
      mode === 'focus' ? "Este pomodoro no se guardará en tus estadísticas." : "¿Quieres saltarte este descanso?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Saltar", style: "destructive", onPress: () => {
          setIsActive(false);
          handleComplete();
        }}
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <Image
          source={require('../assets/images/cutean.jpg')}
          resizeMode="contain"
          style={styles.bannerImage}
        />
        
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{timeString}</Text>
          <Text style={styles.counterText}>#{completedPomodoros + 1}</Text>
        </View>

        {/* ✅ Barra de progreso que avanza */}
        <View style={styles.progressWrapper}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${progress * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={handleResetWithAlert}>
            <Image
              source={require('../assets/images/end.png')}
              resizeMode="contain"
              style={styles.controlButton}
            />
          </TouchableOpacity>
          
          {!isActive ? (
            <TouchableOpacity onPress={handleStart}>
              <Image
                source={require('../assets/images/Play.png')}
                resizeMode="contain"
                style={styles.playButton}
              />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handlePause}>
              <Image
                source={require('../assets/images/Stop.png')}
                resizeMode="contain"
                style={styles.playButton}
              />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={handleSkipWithAlert}>
            <Image
              source={require('../assets/images/next.png')}
              resizeMode="contain"
              style={styles.controlButton}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity  style={styles.backButton}>
          
        </TouchableOpacity>
        
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    backgroundColor: "#212121",
    paddingTop: height * 0.15,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerImage: {
    width: width * 0.7,
    height: width * 0.7,
    alignSelf: 'center',
    borderRadius: width * 0.03,
    marginBottom: height * -0.05,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingHorizontal: width * -0.4,
    marginBottom: height * -0.03,
    marginTop: height * -0.01,
    width: width * 0.8,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: width * 0.12,
    fontWeight: "bold",
    textAlign: "left",
  },
  counterText: {
    color: "#3E3E3E",
    fontSize: width * 0.07,
    fontWeight: "bold",
    textAlign: "right",
  },
  // ✅ ESTILOS DE LA BARRA DE PROGRESO
  progressWrapper: {
    alignItems: "center",
    marginBottom: height * 0.01,
    marginTop: height * -0.07,
    width: width * 0.8,
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
    backgroundColor: "#000000",
    borderRadius: 4,
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: width * 0.1,
    marginBottom: height * 0.05,
    marginTop: height * -0.07,
  },
  controlButton: {
    width: width * 0.22,
    height: width * 0.28,
  },
  playButton: {
    width: width * 0.28,
    height: width * 0.28,
  },
  backButton: {
    marginBottom: height * 0.05,
    padding: height * 0.01,
  },
  backButtonText: {
    color: "#8E8E8E",
    fontSize: width * 0.04,
  },
});

export default PomodoroTimerScreen;