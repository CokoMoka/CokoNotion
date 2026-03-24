import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../../constants/theme';

const StatisticsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('week');
  const theme = Colors.dark;

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const weeklyData = [
    { day: 'Lun', hours: 2.5 },
    { day: 'Mar', hours: 3 },
    { day: 'Mié', hours: 1.5 },
    { day: 'Jue', hours: 4 },
    { day: 'Vie', hours: 2 },
    { day: 'Sáb', hours: 5 },
    { day: 'Dom', hours: 3.5 },
  ];

  let horasTotales = weeklyData.reduce((total, item) => total + item.hours, 0);
  let productividad = Math.round((horasTotales / (weeklyData.length * 4)) * 100);
  let rachaActual = 7;
  let rachas: number[] = [3, 5, 7, 10];

  const achievements = [
    { id: '1', name: 'Racha de 7 días', icon: '🔥', progress: rachas[0], color: '#FF9800' },
    { id: '2', name: '100 Flashcards', icon: '🎴', progress: rachas[1], color: '#4CAF50' },
    { id: '3', name: '50 Pomodoros', icon: '⏱️', progress: rachas[2], color: '#F44336' },
    { id: '4', name: 'Maestro de Notas', icon: '📝', progress: rachas[3], color: '#df96c0' },
  ];

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
                {/* BANNER CON DEGRADADO */}
                <View style={styles.bannerWrapper}>
                  <View style={styles.bannerContainer}>
                    <Image
                      source={require('../../assets/images/aD.jpg')}
                      style={styles.bannerImage}
                      resizeMode="cover"
                    />
                    <LinearGradient
                      colors={['transparent', theme.background]}
                      style={styles.bannerGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                    <View style={styles.bannerOverlay}>
                      <Text style={[styles.bannerTitle, font('rounded')]}>
                        Estadísticas
                      </Text>
                      <Text style={[styles.bannerSubtitle, font('sans')]}>
                        Tu progreso 
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Selector de período */}
                <View style={styles.periodSelector}>
                  <TouchableOpacity 
                    style={[styles.periodOption, selectedPeriod === 'week' &&  { backgroundColor: theme.bearPrimary }]}
                    onPress={() => setSelectedPeriod('week')}
                  >
                    <Text style={[
                      styles.periodText,
                      { color: selectedPeriod === 'week' ? theme.text : theme.textSecondary },
                      font('sans')
                    ]}>
                      Semana
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.periodOption, selectedPeriod === 'month' && { backgroundColor: theme.bearPrimary }]}
                    onPress={() => setSelectedPeriod('month')}
                  >
                    <Text style={[
                      styles.periodText,
                      { color: selectedPeriod === 'month' ? theme.text : theme.textSecondary },
                      font('sans')
                    ]}>
                      Mes
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.periodOption, selectedPeriod === 'year' && { backgroundColor: theme.bearPrimary }]}
                    onPress={() => setSelectedPeriod('year')}
                  >
                    <Text style={[
                      styles.periodText,
                      { color: selectedPeriod === 'year' ? theme.text : theme.textSecondary },
                      font('sans')
                    ]}>
                      Año
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsCards}>
                  <View style={[styles.statCard, { 
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  }]}>
                    <Text style={styles.statCardIcon}>⏰</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {horasTotales}
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.text }, font('sans')]}>
                      Horas totales
                    </Text>
                  </View>
                  <View style={[styles.statCard, { 
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  }]}>
                    <Text style={styles.statCardIcon}>📊</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {productividad}%
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.text }, font('sans')]}>
                      Productividad
                    </Text>
                  </View>
                  <View style={[styles.statCard, { 
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  }]}>
                    <Text style={styles.statCardIcon}>🔥</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {rachaActual}
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.text }, font('sans')]}>
                      Racha actual
                    </Text>
                  </View>
                </View>

                {/* Gráfico de barras */}
                <View style={[styles.chartCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <Text style={[styles.chartTitle, { color: theme.text }, font('sans')]}>
                    Horas de estudio por día
                  </Text>
                  <View style={styles.chartContainer}>
                    {weeklyData.map((item, index) => (
                      <View key={index} style={styles.chartBarContainer}>
                        <View style={styles.chartBarWrapper}>
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                height: item.hours * 15, 
                                backgroundColor: theme.bearPrimary 
                              }
                            ]} 
                          />
                        </View>
                        <Text style={[styles.chartBarLabel, { color: theme.textSecondary }, font('sans')]}>
                          {item.day}
                        </Text>
                        <Text style={[styles.chartBarValue, { color: theme.textMuted }, font('sans')]}>
                          {item.hours}h
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Distribución de estudio */}
                <View style={[styles.distributionCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <Text style={[styles.distributionTitle, { color: theme.text }, font('sans')]}>
                    Distribución de estudio
                  </Text>
                  
                  <View style={styles.distributionItem}>
                    <View style={styles.distributionLabelContainer}>
                      <View style={[styles.distributionColor, { backgroundColor: theme.bearPrimary }]} />
                      <Text style={[styles.distributionLabel, { color: theme.text }, font('sans')]}>
                        Notas
                      </Text>
                    </View>
                    <Text style={[styles.distributionValue, { color: theme.text }, font('rounded')]}>
                      35%
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { width: '35%', backgroundColor: theme.bearPrimary }]} />
                  </View>

                  <View style={styles.distributionItem}>
                    <View style={styles.distributionLabelContainer}>
                      <View style={[styles.distributionColor, { backgroundColor: '#FF9800' }]} />
                      <Text style={[styles.distributionLabel, { color: theme.text }, font('sans')]}>
                        Flashcards
                      </Text>
                    </View>
                    <Text style={[styles.distributionValue, { color: theme.text }, font('rounded')]}>
                      25%
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { width: '25%', backgroundColor: '#FF9800' }]} />
                  </View>

                  <View style={styles.distributionItem}>
                    <View style={styles.distributionLabelContainer}>
                      <View style={[styles.distributionColor, { backgroundColor: '#bd3abd' }]} />
                      <Text style={[styles.distributionLabel, { color: theme.text }, font('sans')]}>
                        Temporizador
                      </Text>
                    </View>
                    <Text style={[styles.distributionValue, { color: theme.text }, font('rounded')]}>
                      40%
                    </Text>
                  </View>
                  <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                    <View style={[styles.progressFill, { width: '40%', backgroundColor: '#bd3abd' }]} />
                  </View>
                </View>

                {/* Logros */}
                <View style={[styles.achievementsCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <Text style={[styles.achievementsTitle, { color: theme.text }, font('sans')]}>
                    Logros
                  </Text>
                  {achievements.map((item) => (
                    <View key={item.id} style={styles.achievementItem}>
                      <Text style={styles.achievementIcon}>{item.icon}</Text>
                      <View style={styles.achievementInfo}>
                        <Text style={[styles.achievementName, { color: theme.text }, font('sans')]}>
                          {item.name}
                        </Text>
                        <View style={[styles.achievementProgressBar, { backgroundColor: theme.border }]}>
                          <View 
                            style={[
                              styles.achievementProgressFill, 
                              { width: `${item.progress}%`, backgroundColor: item.color }
                            ]} 
                          />
                        </View>
                      </View>
                      <Text style={[styles.achievementProgress, { color: theme.text }, font('rounded')]}>
                        {item.progress}%
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Recomendaciones */}
                <View style={[styles.recommendationsCard, { 
                  backgroundColor: theme.background,
                }]}>
                  <Text style={[styles.recommendationsTitle, { color: theme.text }, font('rounded')]}>
                    Recomendaciones
                  </Text>
                  <View style={styles.recommendationItem}>
                    <Text style={styles.recommendationIcon}>💡</Text>
                    <Text style={[styles.recommendationText, { color: theme.text}, font('sans')]}>
                      Ejemplo de recomendación
                    </Text>
                  </View>
                  <View style={styles.recommendationItem}>
                    <Text style={styles.recommendationIcon}>📈</Text>
                    <Text style={[styles.recommendationText, { color: theme.text }, font('sans')]}>
                      Tu productividad aumentó 15% esta semana. ¡Sigue así!
                    </Text>
                  </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    paddingTop: 0,
    paddingBottom: 20,
  },
  // BANNER
  bannerWrapper: {
    marginHorizontal: -20,
    marginBottom: 15,
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 3,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // Selector de período
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  periodOption: {
    marginRight: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Stats Cards
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    width: '31%',
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  // Gráfico
  chartCard: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  chartBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  chartBarWrapper: {
    height: 100,
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
  },
  chartBarLabel: {
    fontSize: 11,
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 10,
    marginTop: 2,
  },
  // Distribución
  distributionCard: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  distributionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  distributionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distributionLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distributionColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  distributionLabel: {
    fontSize: 14,
  },
  distributionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 15,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // Logros
  achievementsCard: {
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  achievementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  achievementIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginHorizontal: 10,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  achievementProgressBar: {
    height: 4,
    borderRadius: 2,
  },
  achievementProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  achievementProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Recomendaciones
  recommendationsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  recommendationIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

export default StatisticsScreen;