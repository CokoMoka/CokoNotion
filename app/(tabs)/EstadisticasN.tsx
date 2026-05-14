// app/(tabs)/Logros.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Image,
  Text,
  TextInput,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "../../hooks/useUser";
import { AppImages } from "../../constants/images";
import { getUserAvatar, getUserBanner, getUserBackground } from "../../services/avatarService";
import { loadAllFlashcardSets } from "../../services/flashcardStorage";
import { getAllNotes } from "../../services/database";
import { BarChart, LineChart, PieChart } from "react-native-gifted-charts";

export default function LogrosScreen() {
  const { width, height } = useWindowDimensions();
  const s = (value: number) => value * (width / 390);
  const v = (value: number) => value * (height / 844);

  const { user, loading: userLoading, refreshUser } = useUser();
  
  const [textInput1, onChangeTextInput1] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para imágenes del usuario
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);
  
  // Estados para estadísticas de flashcards
  const [totalCards, setTotalCards] = useState(0);
  const [totalMastered, setTotalMastered] = useState(0);
  const [totalSets, setTotalSets] = useState(0);
  const [loadingFlashcards, setLoadingFlashcards] = useState(true);
  
  // Estados para notas y notas importantes semanales
  const [weeklyNotes, setWeeklyNotes] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [weeklyImportantNotes, setWeeklyImportantNotes] = useState([0, 0, 0, 0, 0, 0, 0]); // 🔥 Notas importantes
  
  // Fecha de registro
  const [joinDate, setJoinDate] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Datos reales desde el usuario
  const horasEstudiadas = (user?.horasEstudio || 0).toFixed(1);
  const racha = user?.racha || 0;
  const tareasCompletadas = user?.tareasCompletadas || 0;

  // 🔥 Cargar notas de esta semana
  const cargarNotasSemanales = useCallback(async () => {
    try {
      const todasLasNotas = await getAllNotes();
      const notasPorDia = [0, 0, 0, 0, 0, 0, 0];
      const importantesPorDia = [0, 0, 0, 0, 0, 0, 0];
      
      const ahora = new Date();
      const diaActual = ahora.getDay();
      const inicioSemana = new Date(ahora);
      inicioSemana.setDate(ahora.getDate() - diaActual + (diaActual === 0 ? -6 : 1));
      inicioSemana.setHours(0, 0, 0, 0);
      
      todasLasNotas.forEach(nota => {
        if (!nota.date) return;
        
        const partes = nota.date.split('/');
        if (partes.length === 3) {
          const fechaNota = new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
          if (fechaNota >= inicioSemana) {
            const diffDias = Math.floor((fechaNota.getTime() - inicioSemana.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDias >= 0 && diffDias < 7) {
              notasPorDia[diffDias]++;
              // 🔥 Contar notas importantes (isImportant === true)
              if (nota.isImportant) {
                importantesPorDia[diffDias]++;
              }
            }
          }
        }
      });
      
      setWeeklyNotes(notasPorDia);
      setWeeklyImportantNotes(importantesPorDia);
    } catch (error) {
      console.error('Error al cargar notas semanales:', error);
    }
  }, []);

  // Cargar datos de flashcards
  const cargarFlashcardsStats = useCallback(async () => {
    try {
      const sets = await loadAllFlashcardSets();
      const cards = sets.reduce((acc, set) => acc + set.cards.length, 0);
      const mastered = sets.reduce((acc, set) => acc + set.cards.filter(c => c.mastered).length, 0);
      
      setTotalCards(cards);
      setTotalMastered(mastered);
      setTotalSets(sets.length);
    } catch (error) {
      console.error('Error al cargar estadísticas de flashcards:', error);
    }
  }, []);

  // 🔥 CARGAR TODOS LOS DATOS EN PARALELO
  const cargarTodosLosDatos = useCallback(async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        cargarFlashcardsStats(),
        cargarNotasSemanales(),
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  }, [cargarFlashcardsStats, cargarNotasSemanales]);

  // Cargar inicial
  useEffect(() => {
    cargarTodosLosDatos();
  }, [cargarTodosLosDatos]);

  // Cargar imágenes del usuario
  useEffect(() => {
    if (user?.uid) {
      cargarImagenes();
    }
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      setJoinDate(date.toLocaleDateString('es-ES', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      }));
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

  // Función de refresco
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await cargarTodosLosDatos();
      await cargarImagenes();
    } catch (error) {
      console.error('Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, cargarTodosLosDatos]);

  // Datos para gráficos
  const pieData = [
    { value: totalMastered, color: "#4CAF50", text: `${Math.round((totalMastered / (totalCards || 1)) * 100)}%`, label: "Dominadas" },
    { value: totalCards - totalMastered, color: "#df96c0", text: `${Math.round(((totalCards - totalMastered) / (totalCards || 1)) * 100)}%`, label: "Por aprender" },
  ];

  const barData = weeklyNotes.map((value, index) => ({
    value: value,
    label: weekDays[index],
    frontColor: "#df96c0",
  }));

  // 🔥 Datos para gráfico de línea (Notas Importantes)
  const lineData = weeklyImportantNotes.map((value, index) => ({
    value: value,
    label: weekDays[index],
    dataPointText: `${value}`,
  }));

  const percentCards = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  const stats = [
    { value: `${horasEstudiadas}`, label: "Horas Estudiadas", icon: "📓" },
    { value: `${racha}`, label: "Racha Actual", icon: "🔥" },
    { value: `${tareasCompletadas}`, label: "Tareas Completadas", icon: "✍️" },
    { value: `${totalMastered}`, label: "Tarjetas Dominadas", icon: "🎴" },
  ];

  const specialAchievements = [
    { 
      title: "🔥 Maestro de la Constancia", 
      description: "Mantén una racha de estudio de 7 días consecutivos",
      progress: Math.min(100, Math.round((racha / 7) * 100)), 
      icon: "🔥",
      completed: racha >= 7,
      current: `${racha}/7 días`,
    },
    { 
      title: "📓 Estudiante Dedicado", 
      description: "Acumula 100 horas de estudio totales",
      progress: Math.min(100, Math.round((Number(horasEstudiadas) / 100) * 100)), 
      icon: "📓",
      completed: Number(horasEstudiadas) >= 100,
      current: `${horasEstudiadas}/100 horas`,
    },
    { 
      title: "🎴 Amo de las Flashcards", 
      description: "Domina 100 tarjetas de estudio",
      progress: Math.min(100, Math.round((totalMastered / 100) * 100)), 
      icon: "🎴",
      completed: totalMastered >= 100,
      current: `${totalMastered}/100 tarjetas`,
    },
    { 
      title: "🏅 Aprendiz Veloz", 
      description: "Domina 50 tarjetas de estudio",
      progress: Math.min(100, Math.round((totalMastered / 50) * 100)), 
      icon: "⚡",
      completed: totalMastered >= 50,
      current: `${totalMastered}/50 tarjetas`,
    },
    { 
      title: "✨ Racha de Oro", 
      description: "Completa 30 días de estudio consecutivos",
      progress: Math.min(100, Math.round((racha / 30) * 100)), 
      icon: "👑",
      completed: racha >= 30,
      current: `${racha}/30 días`,
    },
  ];

  if (userLoading || loadingImages || loadingData) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#df96c0" />
              <Text style={styles.loadingText}>Cargando estadísticas...</Text>
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
        source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#df96c0', '#FF9F4A']}
                  tintColor="#df96c0"
                  title="Actualizando..."
                  titleColor="#ffffff"
                  progressBackgroundColor="rgba(0,0,0,0.3)"
                />
              }
            >
              <View style={[styles.container, { paddingBottom: v(30) }]}>

                {/* BANNER */}
                <View style={[styles.bannerSection, { marginBottom: v(20) }]}>
                  <View style={{ marginBottom: v(8) }}>
                    <Image
                      source={bannerUrl ? { uri: bannerUrl } : AppImages.banner}
                      resizeMode="cover"
                      style={[styles.bannerImage, { height: s(150), width: '100%' }]}
                    />
                    {avatarUrl ? ( 
                      <Image
                        source={{ uri: avatarUrl }}
                        resizeMode="cover"
                        style={[styles.avatarOverlay, {
                          bottom: s(-70),
                          left: s(20),
                          width: s(90),
                          height: s(90),
                          borderRadius: s(80),
                        }]}
                      />
                    ) : (
                      <Image
                        source={AppImages.icon}
                        resizeMode="cover"
                        style={[styles.avatarOverlay, {
                          bottom: s(-70),
                          left: s(20),
                          width: s(90),
                          height: s(90),
                          borderRadius: s(80),
                          borderWidth: s(3),
                          borderColor: '#FFFFFF',
                        }]}
                      />
                    )}
                  </View>
                  <Text style={[styles.mainTitle, { fontSize: s(32), marginBottom: v(4), marginLeft: s(120) }]}>
                    ¡Mis Logros!
                  </Text>
                  <View style={styles.dateContainer}>
                    <Text style={[styles.dateText, { fontSize: s(12) }]}>
                      Desde el {joinDate || "XX de XXXX de XXXX"}
                    </Text>
                  </View>
                </View>

                {/* ESTADÍSTICAS */}
                <View style={[styles.statsCard, { borderRadius: s(20), paddingVertical: v(16), paddingHorizontal: s(16), marginBottom: v(20), marginHorizontal: s(16) }]}>
                  <View style={[styles.statsIconsRow, { marginBottom: v(-2), gap: s(12) }]}>
                    {stats.map((stat, index) => (
                      <View key={index} style={[styles.statIcon, { height: s(60),  backgroundColor: "#6f6f6f00", borderRadius: s(16), flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ fontSize: s(32) }}>{stat.icon}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.statsValuesRow, { marginBottom: v(8), gap: s(8) }]}>
                    {stats.map((stat, index) => (
                      <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.statValue, { fontSize: s(35), color: '#FFFFFF', fontWeight: 'bold' }]}>{stat.value}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={[styles.statsLabelsRow, { gap: s(8) }]}>
                    {stats.map((stat, index) => (
                      <Text key={index} style={[styles.statLabel, { fontSize: s(10), flex: 1, textAlign: "center", color: "#8E8E8E" }]}>{stat.label}</Text>
                    ))}
                  </View>
                </View>

                {/* GRÁFICO DE PASTEL */}
                <Text style={[styles.sectionTitle, { fontSize: s(20), marginLeft: s(20), marginBottom: v(8), color: "#ffffff", fontWeight: "bold" }]}>Entendimiento de Tarjetas</Text>
                <View style={[styles.chartCard, { borderRadius: s(20), padding: s(16), marginHorizontal: s(16), marginBottom: v(20), backgroundColor: "rgba(42, 47, 52, 0.95)", borderWidth: 1, borderColor: '#343a40' }]}>
                  <View style={styles.chartCenter}>
                    <PieChart
                      data={pieData}
                      donut
                      radius={s(100)}
                      innerRadius={s(45)}
                      textColor="#000000"
                      textSize={s(25)}
                      focusOnPress
                      sectionAutoFocus
                      centerLabelComponent={() => (
                        <View style={styles.centerLabel}>
                          <Text style={[styles.centerLabelBig, { fontSize: s(24), fontWeight: 'bold', color: '#000000' }]}>{totalCards}</Text>
                          <Text style={[styles.centerLabelSmall, { fontSize: s(12), color: '#444444' }]}>Total</Text>
                        </View>
                      )}
                    />
                  </View>
                  <View style={styles.legendContainer}>
                    {pieData.map((item, index) => (
                      <View key={index} style={styles.legendRow}>
                        <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                        <Text style={[styles.legendText, { fontSize: s(11), color: '#b5b5b5' }]}>{item.label}: {item.value} ({item.text})</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* GRÁFICO DE BARRAS */}
                <Text style={[styles.sectionTitle, { fontSize: s(18), marginLeft: s(20), marginBottom: v(8), color: "#FFFFFF", fontWeight: "bold" }]}>Notas Creadas Esta Semana</Text>
                <View style={[styles.chartCard, { borderRadius: s(20), padding: s(16), marginHorizontal: s(16), marginBottom: v(20), backgroundColor: "rgba(42, 47, 52, 0.95)", borderWidth: 1, borderColor: '#343a40' }]}>
                  <BarChart
                    data={barData}
                    barWidth={s(35)}
                    spacing={s(18)}
                    roundedTop
                    roundedBottom
                    hideRules={true}
                    yAxisThickness={1}
                    xAxisThickness={1}
                    noOfSections={4}
                    maxValue={Math.max(...weeklyNotes, 5)}
                    yAxisTextStyle={[styles.axisText, { fontSize: s(10), color: '#ffffff' }]}
                    xAxisLabelTextStyle={[styles.axisText, { fontSize: s(10), color: '#ffffff' }]}
                    isAnimated
                    showValuesAsTopLabel
                    height={s(200)}
                  />
                </View>

                {/* 🔥 GRÁFICO DE LÍNEA: NOTAS IMPORTANTES */}
                <Text style={[styles.sectionTitle, { fontSize: s(18), marginLeft: s(20), marginBottom: v(8), color: "#FFFFFF", fontWeight: "bold" }]}>
                  Notas Importantes Esta Semana
                </Text>
                <View style={[styles.chartCard, { borderRadius: s(20), padding: s(16), marginHorizontal: s(16), marginBottom: v(20), backgroundColor: "rgba(42, 47, 52, 0.95)", borderWidth: 1, borderColor: '#343a40' }]}>
                  <LineChart
                    data={lineData}
                    areaChart
                    color="#FFD700"
                    thickness={2}
                    startFillColor="rgba(255, 215, 0, 0.3)"
                    endFillColor="rgba(255, 215, 0, 0.01)"
                    startOpacity={0.8}
                    endOpacity={0.1}
                    noOfSections={4}
                    yAxisColor="#555555"
                    xAxisColor="#555555"
                    yAxisTextStyle={[styles.axisText, { fontSize: s(10), color: '#b5b5b5' }]}
                    xAxisLabelTextStyle={[styles.axisText, { fontSize: s(10), color: '#b5b5b5' }]}
                    showValuesAsDataPointText
                    dataPointTextStyle={{ color: '#FFD700', fontSize: s(10) }}
                    dataPointsRadius={4}
                    dataPointsColor="#FFD700"
                    curved
                    height={s(200)}
                  />
                </View>

                {/* PROGRESO EN FLASHCARDS */}
                <Text style={[styles.sectionTitle, { fontSize: s(18), marginLeft: s(20), marginBottom: v(8), color: "#FFFFFF", fontWeight: "bold" }]}>🎴 Progreso en Flashcards</Text>
                <View style={[styles.progressCard, { borderRadius: s(20), padding: s(16), marginHorizontal: s(16), marginBottom: v(20), backgroundColor: "#222222" }]}>
                  <View style={[styles.progressHeader, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: v(8) }]}>
                    <Text style={[styles.progressTitle, { fontSize: s(14), color: "#FFFFFF" }]}>Tarjetas Dominadas</Text>
                    <Text style={[styles.progressPercent, { fontSize: s(24), color: "#df96c0", fontWeight: "bold" }]}>{totalMastered}</Text>
                  </View>
                  <View style={[styles.progressBarBg, { height: s(8), backgroundColor: "#2D2D2D", borderRadius: s(4) }]}>
                    <View style={[styles.progressBarFill, { width: `${percentCards}%`, backgroundColor: percentCards === 100 ? '#4CAF50' : '#df96c0', borderRadius: s(4), height: '100%' }]} />
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: v(8) }}>
                    <Text style={[styles.progressSubtext, { fontSize: s(11), color: "#8E8E8E" }]}>{totalMastered} de {totalCards}</Text>
                    <Text style={[styles.progressSubtext, { fontSize: s(11), color: "#8E8E8E" }]}>{percentCards}% completado</Text>
                  </View>
                </View>


                {/* LOGROS ESPECIALES */}
                <Text style={[styles.sectionTitle, { fontSize: s(18), marginLeft: s(20), marginBottom: v(8), color: "#FFFFFF", fontWeight: "bold" }]}>Logros Especiales</Text>
                {specialAchievements.map((achievement, index) => (
                  <View key={index} style={[styles.achievementItem, { borderRadius: s(16), padding: s(12), marginHorizontal: s(16), marginBottom: v(10), flexDirection: 'row', alignItems: 'center', gap: s(12), backgroundColor: achievement.completed ? "rgba(76, 175, 80, 0.15)" : "#2D2D2D", borderWidth: achievement.completed ? 1 : 0, borderColor: achievement.completed ? '#4CAF50' : 'transparent' }]}>
                    <Text style={[styles.achievementIcon, { fontSize: s(32), minWidth: s(50), textAlign: 'center' }]}>{achievement.icon}</Text>
                    <View style={[styles.achievementContent, { flex: 1 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <Text style={[styles.achievementTitle, { fontSize: s(15), color: "#FFFFFF", fontWeight: "600", marginBottom: v(2) }]}>{achievement.title}</Text>
                        {achievement.completed && <Text style={{ fontSize: s(11), color: "#4CAF50", fontWeight: "bold" }}>✓ COMPLETADO</Text>}
                      </View>
                      <Text style={[styles.achievementDescription, { fontSize: s(11), color: "#8E8E8E", marginBottom: v(4) }]}>{achievement.description}</Text>
                      <View style={[styles.achievementProgressBar, { height: s(6), backgroundColor: "#1A1A1A", borderRadius: s(3), marginTop: v(4) }]}>
                        <View style={[styles.achievementProgressFill, { width: `${achievement.progress}%`, backgroundColor: achievement.completed ? '#4CAF50' : '#df96c0', borderRadius: s(3), height: '100%' }]} />
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: v(4) }}>
                        <Text style={[styles.achievementProgressText, { fontSize: s(10), color: "#8E8E8E" }]}>Progreso: {achievement.current}</Text>
                        <Text style={[styles.achievementProgressText, { fontSize: s(10), color: achievement.completed ? "#4CAF50" : "#b5b5b5" }]}>{achievement.progress}%</Text>
                      </View>
                    </View>
                  </View>
                ))}


              </View>
            </ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1 },
  fullScreenBackground: { flex: 1, width: '100%', height: '100%' },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#FFFFFF' },
  bannerSection: { marginBottom: 20 },
  bannerImage: { width: '100%' },
  avatarOverlay: { position: "absolute", marginTop: 80 },
  mainTitle: { color: "#FFFFFF", fontWeight: "bold", textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, marginTop: -7 },
  dateContainer: { alignItems: "center", marginLeft: 15 },
  dateText: { color: "#989898" },
  statsCard: { backgroundColor: "#313131" },
  statsIconsRow: {flexDirection: "row" },
  statIcon: { backgroundColor: "#1A1A1A", justifyContent: 'center', alignItems: 'center' },
  statsValuesRow: { flexDirection: "row" },
  statValue: { textAlign: "center" },
  statsLabelsRow: { flexDirection: "row", flexWrap: "wrap" },
  statLabel: { fontWeight: "500" },
  sectionTitle: {},
  chartCard: {},
  chartCenter: { alignItems: 'center', justifyContent: 'center' },
  centerLabel: { justifyContent: 'center', alignItems: 'center' },
  centerLabelBig: {},
  centerLabelSmall: {},
  legendContainer: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 15, marginTop: 12 },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 14, height: 14, borderRadius: 7, marginRight: 8 },
  legendText: {},
  axisText: {},
  chartHint: {},
  progressCard: { backgroundColor: "#404040" },
  progressHeader: {},
  progressTitle: {},
  progressPercent: {},
  progressBarBg: {},
  progressBarFill: {},
  progressSubtext: {},
  miniCard: {},
  achievementItem: {},
  achievementIcon: {},
  achievementContent: {},
  achievementTitle: {},
  achievementDescription: {},
  achievementProgressBar: {},
  achievementProgressFill: {},
  achievementProgressText: {},
  newGoalItem: {},
  newGoalIcon: {},
  newGoalInput: {},
  addGoalButton: {},
  addGoalText: {},
});