import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTimerStats } from "@/hooks/useTimerStats";
import { useUser } from "@/hooks/useUser";
import { router } from "expo-router";

const { width, height } = Dimensions.get("window");

const PomodoroSetupScreen = () => {
  const [selectedTime, setSelectedTime] = useState(25);
  const timeOptions = [1, 30, 45, 60];

  // ✅ AGREGADO: Hook para estadísticas reales
  const { stats } = useTimerStats();
  const { user } = useUser();

  // ✅ AGREGADO: Navegar al timer con el tiempo seleccionado
  const handleStartTimer = () => {
    router.push({
      pathname: '../Pomodoro',
      params: { selectedTime: selectedTime.toString() }
    });
  };

  // ✅ AGREGADO: Formatear horas
  const horasEstudio = (user?.horasEstudio || 0).toFixed(1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
          <Text style={styles.title}>Pomodoro</Text>
          
          {/* ✅ MODIFICADO: Stats con datos REALES (mismo diseño) */}
          <View style={styles.statsRow}>
            <Image
              source={require("../../assets/images/icon.jpg")}
              resizeMode="contain"
              style={styles.statsImage}
            />
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{user?.racha || 0}</Text>
              <Text style={styles.statLabel}>Racha</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalPomodoros || 0}</Text>
              <Text style={styles.statLabel}>Pomodoros</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{horasEstudio}</Text>
              <Text style={styles.statLabel}>Horas</Text>
            </View>
          </View>

          <Text style={styles.questionText}>¿Duración de la sesión?</Text>

          <View style={styles.timeGrid}>
            {timeOptions.map((time) => (
              <TouchableOpacity
                key={time}
                style={[
                  styles.timeButton,
                  selectedTime === time && styles.timeButtonActive
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeButtonText,
                  selectedTime === time && styles.timeButtonTextActive
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ✅ MODIFICADO: Botón Iniciar con navegación */}
          <TouchableOpacity 
            style={styles.startButton}
            onPress={handleStartTimer}
          >
            <Text style={styles.startButtonText}>Iniciar</Text>
          </TouchableOpacity>

          {/* ✅ AGREGADO: Sección de estadísticas de HOY (nuevo, pero puedes omitir si no lo quieres) */}
          {/* Si NO quieres agregar nada nuevo, elimina este bloque */}
          <View style={styles.todayStats}>
            <Text style={styles.todayStatsTitle}>Estadísticas de hoy</Text>
            <View style={styles.todayStatsRow}>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{stats.todayPomodoros}</Text>
                <Text style={styles.todayStatLabel}>Pomodoros</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{stats.todayMinutes}min</Text>
                <Text style={styles.todayStatLabel}>Estudio</Text>
              </View>
              <View style={styles.todayStat}>
                <Text style={styles.todayStatNumber}>{stats.todayBreaks}</Text>
                <Text style={styles.todayStatLabel}>Descansos</Text>
              </View>
            </View>
          </View>
          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ✅ ESTILOS: Agregar nuevos estilos para la sección de hoy (opcional)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1C",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.03,
    paddingHorizontal: width * 0.04,
  },
  title: {
    color: "#FFFFFF",
    fontSize: width * 0.08,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: height * 0.02,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  statsImage: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: width * 0.10,
    fontWeight: "bold",
    marginBottom: height * 0.005,
  },
  statLabel: {
    color: "#8E8E8E",
    fontSize: width * 0.03,
    fontWeight: "bold",
  },
  questionText: {
    color: "#FFFFFF",
    fontSize: width * 0.07,
    fontWeight: "bold",
    marginBottom: height * 0.02,
    marginLeft: width * 0.02,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: width * 0.03,
    marginBottom: height * 0.03,
  },
  timeButton: {
    width: width * 0.2,
    alignItems: "center",
    backgroundColor: "#2E2E2E",
    borderRadius: width * 0.042,
    paddingVertical: height * 0.02,
  },
  timeButtonActive: {
    backgroundColor: "#626262",
  },
  timeButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.07,
    fontWeight: "bold",
  },
  timeButtonTextActive: {
    color: "#1C1C1C",
  },
  startButton: {
    alignItems: "center",
    backgroundColor: "#2E2E2E",
    borderRadius: width * 0.10,
    paddingVertical: height * 0.01,
    marginBottom: height * 0.04,
    marginHorizontal: width * 0.01,
  },
  startButtonText: {
    color: "#6d6d6d",
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  // ✅ ESTILOS NUEVOS (solo si agregaste la sección de hoy)
  todayStats: {
    backgroundColor: "#2D2D2D",
    borderRadius: width * 0.04,
    padding: width * 0.04,
    marginTop: height * 0.02,
  },
  todayStatsTitle: {
    color: "#FFFFFF",
    fontSize: width * 0.045,
    fontWeight: "bold",
    marginBottom: height * 0.02,
    textAlign: "center",
  },
  todayStatsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  todayStat: {
    alignItems: "center",
  },
  todayStatNumber: {
    color: "#df96c0",
    fontSize: width * 0.06,
    fontWeight: "bold",
  },
  todayStatLabel: {
    color: "#8E8E8E",
    fontSize: width * 0.03,
    fontWeight: "bold",
  },
});

export default PomodoroSetupScreen;