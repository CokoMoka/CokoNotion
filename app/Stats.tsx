import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useCallback } from 'react';
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
  RefreshControl,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../constants/theme';
import { useUser } from '../hooks/useUser';
import { useTimerStats } from '@/hooks/useTimerStats';

const StatisticsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, refreshUser } = useUser();
  const { stats, forceSync, isLoading: statsLoading } = useTimerStats();
  
  const theme = Colors.light;

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Datos reales del usuario
  const rachaActual = user?.racha || 0;
  const horasTotales = user?.horasEstudio || 0;
  const tareasCompletadas = user?.tareasCompletadas || 0;
  
  // Datos del timer de hoy
  const pomodorosHoy = stats.todayPomodoros;
  const minutosEstudioHoy = stats.todayMinutes;
  const horasEstudioHoy = (minutosEstudioHoy / 60).toFixed(1);
  
  // Calcular productividad (ejemplo: basado en meta diaria de 4 horas)
  const metaDiariaHoras = 4; // 4 horas al día
  const productividadHoy = Math.min(100, Math.round((minutosEstudioHoy / 60 / metaDiariaHoras) * 100));
  
  // Datos semanales (simulados por ahora - puedes expandir para guardar histórico)
  const weeklyData = [
    { day: 'Lun', hours: 2.5 },
    { day: 'Mar', hours: 3 },
    { day: 'Mié', hours: 1.5 },
    { day: 'Jue', hours: 4 },
    { day: 'Vie', hours: 2 },
    { day: 'Sáb', hours: 5 },
    { day: 'Dom', hours: 3.5 },
  ];

  // Calcular total de horas del período seleccionado
  const getHorasDelPeriodo = () => {
    switch(selectedPeriod) {
      case 'week':
        return weeklyData.reduce((total, item) => total + item.hours, 0);
      case 'month':
        return horasTotales; // En un mes real, sería la suma del mes
      case 'year':
        return horasTotales;
      default:
        return horasTotales;
    }
  };

  const horasPeriodo = getHorasDelPeriodo();
  const productividadPeriodo = Math.min(100, Math.round((horasPeriodo / (7 * metaDiariaHoras)) * 100));

  // Logros basados en datos reales
  const achievements = [
    { 
      id: '1', 
      name: 'Racha de 7 días', 
      icon: '🔥', 
      progress: Math.min(100, Math.round((rachaActual / 7) * 100)), 
      color: '#FF9800',
      completed: rachaActual >= 7
    },
    { 
      id: '2', 
      name: '100 Flashcards', 
      icon: '🎴', 
      progress: Math.min(100, Math.round((tareasCompletadas / 100) * 100)), 
      color: '#4CAF50',
      completed: tareasCompletadas >= 100
    },
    { 
      id: '3', 
      name: '50 Pomodoros', 
      icon: '⏱️', 
      progress: Math.min(100, Math.round((stats.totalPomodoros || 0) / 50 * 100)), 
      color: '#F44336',
      completed: (stats.totalPomodoros || 0) >= 50
    },
    { 
      id: '4', 
      name: '100 Horas de estudio', 
      icon: '📚', 
      progress: Math.min(100, Math.round((horasTotales / 100) * 100)), 
      color: '#df96c0',
      completed: horasTotales >= 100
    },
    { 
      id: '5', 
      name: 'Estudio diario', 
      icon: '⭐', 
      progress: Math.min(100, Math.round((pomodorosHoy / 4) * 100)), 
      color: '#2196F3',
      completed: pomodorosHoy >= 4
    },
  ];

  // Recomendaciones basadas en datos reales
  const getRecomendaciones = () => {
    const recomendaciones = [];
    
    if (rachaActual === 0) {
      recomendaciones.push({
        icon: '🔥',
        texto: '¡Comienza tu racha hoy! Estudia al menos 25 minutos para activar tu racha.'
      });
    } else if (rachaActual < 7) {
      recomendaciones.push({
        icon: '🎯',
        texto: `¡Vas por una racha de ${rachaActual} días! A 7 días conseguirás un logro.`
      });
    } else if (rachaActual >= 7) {
      recomendaciones.push({
        icon: '🏆',
        texto: `¡Increíble! ${rachaActual} días de racha. ¡Sigue así!`
      });
    }
    
    if (minutosEstudioHoy < 60) {
      recomendaciones.push({
        icon: '⏰',
        texto: 'Hoy has estudiado poco. ¡Intenta completar al menos 1 pomodoro más!'
      });
    } else if (minutosEstudioHoy >= 120) {
      recomendaciones.push({
        icon: '💪',
        texto: '¡Excelente! Has superado las 2 horas de estudio hoy.'
      });
    }
    
    if (productividadHoy < 50) {
      recomendaciones.push({
        icon: '📈',
        texto: 'Establece metas diarias para mejorar tu productividad.'
      });
    }
    
    if (recomendaciones.length === 0) {
      recomendaciones.push({
        icon: '🎉',
        texto: '¡Vas excelente! Sigue manteniendo este ritmo de estudio.'
      });
    }
    
    return recomendaciones.slice(0, 3); // Máximo 3 recomendaciones
  };

  // Función de refresco
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await forceSync();
      console.log('✅ Estadísticas actualizadas');
    } catch (error) {
      console.error('❌ Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, forceSync]);

  const recomendaciones = getRecomendaciones();

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={require('../assets/images/bD.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <ScrollView 
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#df96c0', '#FF9F4A']}
                  tintColor="#df96c0"
                  title="Actualizando..."
                  titleColor="#ffffff"
                />
              }
            >
              <View style={styles.container}>
                {/* BANNER */}
                <View style={styles.bannerWrapper}>
                  <View style={styles.bannerContainer}>
                    <Image
                      source={require('../assets/images/aD.jpg')}
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
                        Tu progreso en tiempo real
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Selector de período */}
                <View style={styles.periodSelector}>
                  {['week', 'month', 'year'].map((period) => (
                    <TouchableOpacity 
                      key={period}
                      style={[styles.periodOption, selectedPeriod === period && { backgroundColor: theme.bearPrimary }]}
                      onPress={() => setSelectedPeriod(period)}
                    >
                      <Text style={[
                        styles.periodText,
                        { color: selectedPeriod === period ? theme.text : theme.textSecondary },
                        font('sans')
                      ]}>
                        {period === 'week' ? 'Semana' : period === 'month' ? 'Mes' : 'Año'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Stats Cards - HOY */}
                <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
                  Hoy
                </Text>
                <View style={styles.statsCards}>
                  <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.statCardIcon}>🍅</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {pomodorosHoy}
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.textMuted }, font('sans')]}>
                      Pomodoros
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.statCardIcon}>⏱️</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {horasEstudioHoy}h
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.textMuted }, font('sans')]}>
                      Estudiado
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.statCardIcon}>📊</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {productividadHoy}%
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.textMuted }, font('sans')]}>
                      Productividad
                    </Text>
                  </View>
                </View>

                {/* Stats Cards - TOTALES */}
                <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
                  Totales
                </Text>
                <View style={styles.statsCards}>
                  <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.statCardIcon}>🔥</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {rachaActual}
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.textMuted }, font('sans')]}>
                      Racha actual
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.statCardIcon}>📚</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {horasTotales.toFixed(1)}h
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.textMuted }, font('sans')]}>
                      Horas totales
                    </Text>
                  </View>
                  <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={styles.statCardIcon}>✅</Text>
                    <Text style={[styles.statCardValue, { color: theme.text }, font('rounded')]}>
                      {tareasCompletadas}
                    </Text>
                    <Text style={[styles.statCardLabel, { color: theme.textMuted }, font('sans')]}>
                      Tareas
                    </Text>
                  </View>
                </View>

                {/* Gráfico de barras semanal */}
                <View style={[styles.chartCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.chartTitle, { color: theme.text }, font('sans')]}>
                    Horas de estudio esta semana
                  </Text>
                  <View style={styles.chartContainer}>
                    {weeklyData.map((item, index) => (
                      <View key={index} style={styles.chartBarContainer}>
                        <View style={styles.chartBarWrapper}>
                          <View 
                            style={[
                              styles.chartBar, 
                              { 
                                height: Math.min(80, item.hours * 15), 
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
                  <Text style={[styles.chartTotal, { color: theme.textSecondary }, font('sans')]}>
                    Total: {horasPeriodo.toFixed(1)} horas
                  </Text>
                </View>

                {/* Logros */}
                <View style={[styles.achievementsCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.achievementsTitle, { color: theme.text }, font('sans')]}>
                    Logros
                  </Text>
                  {achievements.map((item) => (
                    <View key={item.id} style={styles.achievementItem}>
                      <Text style={[styles.achievementIcon, item.completed && { opacity: 1 }]}>{item.icon}</Text>
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
                      <Text style={[styles.achievementProgress, { color: item.completed ? theme.bearPrimary : theme.textMuted }, font('rounded')]}>
                        {item.completed ? '✓' : `${item.progress}%`}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Recomendaciones personalizadas */}
                <View style={[styles.recommendationsCard, { backgroundColor: theme.background }]}>
                  <Text style={[styles.recommendationsTitle, { color: theme.text }, font('rounded')]}>
                    Recomendaciones para ti
                  </Text>
                  {recomendaciones.map((rec, index) => (
                    <View key={index} style={styles.recommendationItem}>
                      <Text style={styles.recommendationIcon}>{rec.icon}</Text>
                      <Text style={[styles.recommendationText, { color: theme.text }, font('sans')]}>
                        {rec.texto}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Frase motivacional */}
                <View style={[styles.quoteCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={styles.quoteIcon}>🎯</Text>
                  <Text style={[styles.quoteText, { color: theme.textSecondary }, font('sans')]}>
                    {rachaActual >= 7 
                      ? `¡${rachaActual} días de racha! Eres una máquina de estudio.`
                      : rachaActual > 0 
                        ? `Llevas ${rachaActual} días seguidos estudiando. ¡No pares!`
                        : `Cada gran viaje comienza con un primer paso. ¡Empieza hoy!`}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  periodOption: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 12,
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
  chartTotal: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 12,
  },
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
  recommendationsCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 15,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  quoteCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StatisticsScreen;