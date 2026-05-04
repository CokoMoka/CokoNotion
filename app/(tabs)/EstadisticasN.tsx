// app/(tabs)/Logros.tsx
import React, { useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImages } from "../../constants/images";

export default function LogrosScreen() {
  const { width, height } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;
  const v = (value: number) => value * (height / 844);

  const [textInput1, onChangeTextInput1] = useState('');

  // Datos de ejemplo para estadísticas
  const stats = [
    { value: "64", label: "Horas Estudiadas", icon: "📓" },
    { value: "7", label: "Racha Actual", icon: "🔥" },
    { value: "32", label: "Tareas Completadas", icon: "✍️" },
    { value: "12", label: "Recompensas", icon: "🏆" },
  ];

  // Datos de ejemplo para gráficos (logros por mes)
  const monthlyProgress = [
    { month: "Ene", value: 80 },
    { month: "Feb", value: 65 },
    { month: "Mar", value: 90 },
    { month: "Abr", value: 75 },
    { month: "May", value: 85 },
    { month: "Jun", value: 70 },
  ];

  // Logros especiales
  const specialAchievements = [
    { title: "Racha de 7 Días", progress: 100, icon: "🌟" },
    { title: "100 Horas Estudiadas", progress: 64, icon: "📓" },
    { title: "Maestro de Flashcards", progress: 45, icon: "🎴" },
  ];

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ImageBackground
        source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
        
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={[styles.container, { paddingBottom: v(30) }]}>

                {/* ========== BANNER CON IMÁGENES ORIGINALES ========== */}
                <View style={[styles.bannerSection, { marginBottom: v(20) }]}>
                  <View style={{ marginBottom: v(8) }}>
                    <Image
                      source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/bGeXzy3fHJ/0xlmyf1a_expires_30_days.png" }}
                      resizeMode="stretch"
                      style={[styles.bannerImage, { height: s(150) }]}
                    />
                    <Image
                      source={{ uri: "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/bGeXzy3fHJ/8m49a3v5_expires_30_days.png" }}
                      resizeMode="stretch"
                      style={[styles.avatarOverlay, {
                        bottom: s(-70),
                        left: s(20),
                        width: s(90),
                        height: s(90),
                        borderRadius: s(80),
                      }]}
                    />
                  </View>
                  
                  <Text style={[styles.mainTitle, {
                    fontSize: s(32),
                    marginBottom: v(4),
                    marginLeft: s(120),
                  }]}>
                    ¡XXX Logros!
                  </Text>
                  
                  <View style={styles.dateContainer}>
                    <Text style={[styles.dateText, {
                      fontSize: s(12),
                    }]}>
                      Desde el XX de XXXX de XXXX
                    </Text>
                  </View>
                </View>

                {/* ========== SECCIÓN 1: ESTADÍSTICAS DEL USUARIO ========== */}
                <View style={[styles.statsCard, {
                  borderRadius: s(20),
                  paddingVertical: v(16),
                  paddingHorizontal: s(16),
                  marginBottom: v(20),
                  marginHorizontal: s(16),
                }]}>
                  {/* Iconos (antes eran rectángulos negros, ahora son emojis) */}
                  <View style={[styles.statsIconsRow, {
                    marginBottom: v(12),
                    gap: s(12),
                  }]}>
                    {stats.map((stat, index) => (
                      <View key={index} style={[styles.statIcon, {
                        height: s(60),
                        borderRadius: s(16),
                        flex: 1,
                        backgroundColor: "#1A1A1A",
                        justifyContent: 'center',
                        alignItems: 'center',
                      }]}>
                        <Text style={{ fontSize: s(32) }}>{stat.icon}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Valores numéricos */}
                  <View style={[styles.statsValuesRow, {
                    marginBottom: v(8),
                    gap: s(8),
                  }]}>
                    {stats.map((stat, index) => (
                      <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={[styles.statValue, {
                          fontSize: s(32),
                          color: '#FFFFFF',
                          fontWeight: 'bold',
                        }]}>
                          {stat.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                  
                  {/* Etiquetas */}
                  <View style={[styles.statsLabelsRow, {
                    gap: s(8),
                  }]}>
                    {stats.map((stat, index) => (
                      <Text key={index} style={[styles.statLabel, {
                        fontSize: s(10),
                        flex: 1,
                        textAlign: "center",
                        color: "#8E8E8E",
                      }]}>
                        {stat.label}
                      </Text>
                    ))}
                  </View>
                </View>

                {/* ========== SECCIÓN 2: GRÁFICO DE PROGRESO ========== */}
                <Text style={[styles.sectionTitle, {
                  fontSize: s(18),
                  marginLeft: s(20),
                  marginBottom: v(8),
                  color: "#FFFFFF",
                  fontWeight: "bold",
                }]}>
                  Progreso Semanal
                </Text>
                
                <View style={[styles.chartCard, {
                  borderRadius: s(20),
                  padding: s(16),
                  marginHorizontal: s(16),
                  marginBottom: v(20),
                  backgroundColor: "#222222",
                }]}>
                  <View style={[styles.chartBars, { height: s(120), flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' }]}>
                    {monthlyProgress.map((item, index) => (
                      <View key={index} style={[styles.chartBarContainer, { alignItems: 'center', flex: 1 }]}>
                        <View style={[styles.chartBar, {
                          height: s(item.value),
                          width: s(25),
                          backgroundColor: "#df96c0",
                          borderRadius: s(8),
                          marginBottom: s(8),
                        }]} />
                        <Text style={[styles.chartLabel, { fontSize: s(10), color: "#FFFFFF" }]}>{item.month}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* ========== GRÁFICO DE TARJETAS APRENDIDAS ========== */}
                <Text style={[styles.sectionTitle, {
                  fontSize: s(18),
                  marginLeft: s(20),
                  marginBottom: v(8),
                  color: "#FFFFFF",
                  fontWeight: "bold",
                }]}>
                  Tarjetas Aprendidas
                </Text>
                
                <View style={[styles.progressCard, {
                  borderRadius: s(20),
                  padding: s(16),
                  marginHorizontal: s(16),
                  marginBottom: v(20),
                  backgroundColor: "#222222",
                }]}>
                  <View style={[styles.progressHeader, { flexDirection: 'row', justifyContent: 'space-between', marginBottom: v(8) }]}>
                    <Text style={[styles.progressTitle, { fontSize: s(14), color: "#FFFFFF" }]}>Total de tarjetas</Text>
                    <Text style={[styles.progressPercent, { fontSize: s(24), color: "#df96c0", fontWeight: "bold" }]}>128</Text>
                  </View>
                  <View style={[styles.progressBarBg, { height: s(8), backgroundColor: "#2D2D2D", borderRadius: s(4) }]}>
                    <View style={[styles.progressBarFill, { width: '64%', backgroundColor: "#df96c0", borderRadius: s(4), height: '100%' }]} />
                  </View>
                  <Text style={[styles.progressSubtext, { fontSize: s(11), marginTop: v(6), color: "#8E8E8E" }]}>
                    82 dominadas • 46 por aprender
                  </Text>
                </View>

                {/* ========== SECCIÓN DE LOGROS ESPECIALES ========== */}
                <Text style={[styles.sectionTitle, {
                  fontSize: s(18),
                  marginLeft: s(20),
                  marginBottom: v(8),
                  color: "#FFFFFF",
                  fontWeight: "bold",
                }]}>
                  ¡Logros Especiales!
                </Text>

                {specialAchievements.map((achievement, index) => (
                  <View key={index} style={[styles.achievementItem, {
                    borderRadius: s(16),
                    padding: s(12),
                    marginHorizontal: s(16),
                    marginBottom: v(10),
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: s(12),
                    backgroundColor: "#2D2D2D",
                  }]}>
                    <Text style={[styles.achievementIcon, { fontSize: s(28), minWidth: s(40), textAlign: 'center' }]}>{achievement.icon}</Text>
                    <View style={[styles.achievementContent, { flex: 1 }]}>
                      <Text style={[styles.achievementTitle, { fontSize: s(14), color: "#FFFFFF", fontWeight: "600", marginBottom: v(4) }]}>
                        {achievement.title}
                      </Text>
                      <View style={[styles.achievementProgressBar, { height: s(6), backgroundColor: "#1A1A1A", borderRadius: s(3) }]}>
                        <View style={[styles.achievementProgressFill, {
                          width: `${achievement.progress}%`,
                          backgroundColor: achievement.progress === 100 ? '#9871aa' : '#df96c0',
                          borderRadius: s(3),
                          height: '100%',
                        }]} />
                      </View>
                      <Text style={[styles.achievementProgressText, { fontSize: s(10), marginTop: v(4), color: "#8E8E8E" }]}>
                        {achievement.progress}% completado
                      </Text>
                    </View>
                  </View>
                ))}

                {/* ========== NUEVA META (INPUT) ========== */}
                <View style={[styles.newGoalItem, {
                  borderRadius: s(16),
                  padding: s(12),
                  marginHorizontal: s(16),
                  marginBottom: v(30),
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: s(12),
                  backgroundColor: "#2D2D2D",
                }]}>
                  <Text style={[styles.newGoalIcon, { fontSize: s(24), minWidth: s(40), textAlign: 'center' }]}>🌺</Text>
                  <TextInput
                    placeholder="Establecer nueva meta..."
                    placeholderTextColor="#888888"
                    value={textInput1}
                    onChangeText={onChangeTextInput1}
                    style={[styles.newGoalInput, { fontSize: s(14), color: "#FFFFFF", flex: 1, paddingVertical: s(8) }]}
                  />
                  <TouchableOpacity style={[styles.addGoalButton, { 
                    borderRadius: s(12), 
                    paddingHorizontal: s(12), 
                    paddingVertical: s(6), 
                    backgroundColor: "#df96c0" 
                  }]}>
                    <Text style={[styles.addGoalText, { fontSize: s(12), color: "#FFFFFF", fontWeight: "bold" }]}>Agregar</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
        
        </View>
      </ImageBackground>
    </View>
  );
}

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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  // Banner original
  bannerSection: {
    marginBottom: 20,
  },
  bannerImage: {
    width: '100%',
  },
  avatarOverlay: {
    position: "absolute",
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginTop: 80,
  },
  mainTitle: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginTop: -7,
  },
  dateContainer: {
    alignItems: "center",
    marginLeft: 15,
  },
  dateText: {
    color: "#989898",
  },
  // Stats Card
  statsCard: {
    backgroundColor: "#313131",
  },
  statsIconsRow: {
    flexDirection: "row",
  },
  statIcon: {
    backgroundColor: "#1A1A1A",
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsValuesRow: {
    flexDirection: "row",
  },
  statValue: {
    textAlign: "center",
  },
  statsLabelsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statLabel: {
    fontWeight: "500",
  },
  // Section Title
  sectionTitle: {},
  // Chart Card
  chartCard: {
    backgroundColor: "#404040",
  },
  chartBars: {},
  chartBarContainer: {},
  chartBar: {},
  chartLabel: {},
  // Progress Card
  progressCard: {
    backgroundColor: "#404040",
  },
  progressHeader: {},
  progressTitle: {},
  progressPercent: {},
  progressBarBg: {},
  progressBarFill: {},
  progressSubtext: {},
  // Achievement Items
  achievementItem: {},
  achievementIcon: {},
  achievementContent: {},
  achievementTitle: {},
  achievementProgressBar: {},
  achievementProgressFill: {},
  achievementProgressText: {},
  // New Goal
  newGoalItem: {},
  newGoalIcon: {},
  newGoalInput: {},
  addGoalButton: {},
  addGoalText: {},
});