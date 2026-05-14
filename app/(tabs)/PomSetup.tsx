import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  ScrollView,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTimerStats } from "@/hooks/useTimerStats";
import { useUser } from "@/hooks/useUser";
import { router } from "expo-router";
import { getUserAvatar, getUserBanner, getUserBackground } from "../../services/avatarService";
import { AppImages } from "@/constants/images";

const { width, height } = Dimensions.get("window");

const PomodoroSetupScreen = () => {
  const [selectedTime, setSelectedTime] = useState(25);
  const timeOptions = [1, 30, 45, 60];

  // Estados para imágenes del usuario
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);
  
  // 🔥 Estado para refresh
  const [refreshing, setRefreshing] = useState(false);

  // Hooks existentes
  const { stats, forceSync, resetDailyStats } = useTimerStats();
  const { user, loading: userLoading, refreshUser } = useUser();

  // Cargar imágenes del usuario
  useEffect(() => {
    if (user?.uid) {
      cargarImagenes();
    }
  }, [user]);

  const cargarImagenes = async () => {
    if (!user?.uid) return;
    setLoadingImages(true);
    
    try {
      const [avatar, banner, background] = await Promise.all([
        getUserAvatar(user.uid),
        getUserBanner(user.uid),
        getUserBackground(user.uid),
      ]);
      
      setAvatarUrl(avatar);
      setBannerUrl(banner);
      setBackgroundUrl(background);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  // 🔥 Función de refresco (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Recargar datos del usuario desde Firestore
      await refreshUser();
      // Forzar sincronización de estadísticas
      await forceSync();
      // Recargar imágenes
      await cargarImagenes();
      console.log('✅ Pantalla de Pomodoro refrescada correctamente');
    } catch (error) {
      console.error('❌ Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, forceSync]);

  // Navegar al timer con el tiempo seleccionado
  const handleStartTimer = () => {
    router.push({
      pathname: '../Pomodoro',
      params: { selectedTime: selectedTime.toString() }
    });
  };

  // Formatear horas
  const horasEstudio = (user?.horasEstudio || 0).toFixed(1);

  if (userLoading || loadingImages) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={backgroundUrl ? { uri: backgroundUrl } : require('../../assets/images/bD.jpg')}
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
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              // 🔥 Añadir RefreshControl
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#df96c0', '#FF9F4A']}
                  tintColor="#df96c0"
                  title="Actualizando estadísticas..."
                  titleColor="#ffffff"
                  progressBackgroundColor="rgba(0,0,0,0.3)"
                />
              }
            >
              <View style={styles.content}>
                
                <Text style={styles.title}>Pomodoro</Text>
                
                {/* Stats con imagen de avatar del usuario */}
                <View style={styles.statsRow}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      resizeMode="cover"
                      style={styles.statsImage}
                    />
                  ) : (
                    <Image
                      source={AppImages.icon}
                      resizeMode="contain"
                      style={styles.statsImage}
                    />
                  )}
                  
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

                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={handleStartTimer}
                >
                  <Text style={styles.startButtonText}>Iniciar</Text>
                </TouchableOpacity>

                {/* Sección de estadísticas de hoy */}
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
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  fullScreenBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.44)',
  },
  safeArea: {
    flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  title: {
    color: "#FFFFFF",
    fontSize: width * 0.08,
    fontWeight: "bold",
    textAlign: "left",
    marginBottom: height * 0.02,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: height * 0.03,
  },
  statsImage: {
    width: width * 0.22,
    height: width * 0.22,
    borderRadius: width * 0.11,
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
    backgroundColor: "#121212",
    borderRadius: width * 0.042,
    borderColor: "#7f7f7f53",
    borderWidth: 1,
    paddingVertical: height * 0.02,
  },
  timeButtonActive: {
    backgroundColor: "#2f2f2f",
  },
  timeButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.07,
    fontWeight: "bold",
  },
  timeButtonTextActive: {
    color: "#000000",
  },
  startButton: {
    alignItems: "center",
    backgroundColor: "#090909",
    borderRadius: width * 0.10,
    paddingVertical: height * 0.01,
    marginBottom: height * 0.04,
    borderWidth: 0.7,
    borderColor: '#616161',
    marginHorizontal: width * 0.01,
  },
  startButtonText: {
    color: "#a1a1a1",
    fontSize: width * 0.05,
    fontWeight: "bold",
  },
  todayStats: {
    backgroundColor: "#121212",
    borderRadius: width * 0.04,
    padding: width * 0.04,
    marginTop: height * 0.02,
    borderWidth: 1.2,
    borderColor: "#7f7f7f53",
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