import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../../constants/theme';
import { useUser } from '../../hooks/useUser';

// ✅ Componente principal
const DashboardScreen = () => {
  const { user, loading } = useUser();
  const [userName, setUserName] = useState("Estudiante");

  const theme = Colors.light;
  let cita = "Ejemplo de cita";
  let autorCita = "Autor de la cita";

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const stats = [
    { label: 'Racha actual', value: '7 días', icon: '🔥' },
    { label: 'Horas estudiadas', value: '28.5h', icon: '⏰' },
    { label: 'Tareas completadas', value: '15', icon: '✅' },
    { label: 'Recompensas', value: '3', icon: '🏆' },
  ];

  const quickActions = [
    { name: 'Notas', icon: 'ᝰ.ᐟ', color: theme.border },
    { name: 'Flashcards', icon: '𖡎', color: theme.border },
    { name: 'Temporizador', icon: '⏱', color: theme.border },
    { name: 'Estadísticas', icon: 'ılı', color: theme.border },
  ];

  // ✅ Cargar nombre del usuario autenticado
  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName);
    }
  }, [user]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#df96c0" />
        </View>
      </SafeAreaProvider>
    );
  }

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
                      style={styles.bannerGradientExtra}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />
                    <View style={styles.bannerOverlay}>
                      <Text style={[styles.bannerTitle, font('rounded')]}>
                        Inicio
                      </Text>
                      <Text style={[styles.bannerSubtitle, font('sans')]}>
                        Bienvenido a tu espacio 
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Header con imagen de osito */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <View style={styles.bearIconContainer}>
                      <Text style={styles.bearIcon}>🐕</Text>
                    </View>
                    <View>
                      <Text style={[styles.greeting, font('rounded')]}>
                        ¡Hola, {userName}!
                      </Text>
                      <Text style={[styles.date, font('sans')]}>
                        {new Date().toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.headerIcons}>
                    <TouchableOpacity style={styles.iconButton}>
                      <Text style={styles.icon}>⢰</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Próximas Tareas */}
                <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
                  Próximas Tareas
                </Text>
                <View style={[styles.tasksCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <View style={styles.taskItem}>
                    <View style={[styles.taskCheckbox, { borderColor: theme.bearPrimary }]} />
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: theme.text }, font('sans')]}>
                        Estudiar React Native
                      </Text>
                      <Text style={[styles.taskTime, { color: theme.textMuted }, font('sans')]}>
                        Hoy, 6:00 PM
                      </Text>
                    </View>
                    <Text style={[styles.taskSubject, { color: theme.text }, font('sans')]}>
                      Programación
                    </Text>
                  </View>

                  <View style={[styles.taskDivider, { backgroundColor: theme.border }]} />

                  <View style={styles.taskItem}>
                    <View style={[styles.taskCheckbox, { borderColor: theme.bearPrimary }]} />
                    <View style={styles.taskContent}>
                      <Text style={[styles.taskTitle, { color: theme.text }, font('sans')]}>
                        Hacer Flashcards
                      </Text>
                      <Text style={[styles.taskTime, { color: theme.textMuted }, font('sans')]}>
                        Mañana, 10:00 AM
                      </Text>
                    </View>
                    <Text style={[styles.taskSubject, { color: theme.text }, font('sans')]}>
                      Estudio
                    </Text>
                  </View>
                </View>

                {/* Quick Actions */}
                <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
                  Acciones Rápidas
                </Text>
                <View style={styles.quickActionsGrid}>
                  {quickActions.map((action, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={[styles.actionCard, { 
                          backgroundColor: theme.background,
                          borderColor: theme.border,
                      }]}
                    >
                      <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                        <Text style={styles.actionIcon}>{action.icon}</Text>
                      </View>
                      <Text style={[styles.actionName, { color: theme.text }, font('sans')]}>
                        {action.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Frase motivacional */}
                <View style={[styles.quoteCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <Text style={styles.quoteIcon}>🐶</Text>
                  <Text style={[styles.quoteText, { color: theme.textSecondary }, font('sans')]}>
                    {cita}
                  </Text>
                  <Text style={[styles.quoteAuthor, { color: theme.text }, font('rounded')]}>
                    — {autorCita}
                  </Text>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                  {stats.map((stat, index) => (
                    <View key={index} style={[styles.statCard, { 
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    }]}>
                      <Text style={styles.statIcon}>{stat.icon}</Text>
                      <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
                        {stat.value}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  // BANNER
  bannerWrapper: {
    marginHorizontal: -20,
    marginBottom: -30,
    marginTop: -10,
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ff009900',
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
  bannerGradientExtra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 4,
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
    marginTop: -7,
    marginBottom: 10,
    fontWeight: '500',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 45,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bearIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#ffffff4b',
  },
  bearIcon: {
    fontSize: 30,
    backgroundColor: 'transparent',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  date: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerIcons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  icon: {
    fontSize: 30,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 15,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIcon: {
    fontSize: 30,
  },
  actionName: {
    fontSize: 14,
    fontWeight: '500',
  },
  tasksCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  taskTime: {
    fontSize: 12,
  },
  taskSubject: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDivider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  quoteCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  quoteIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 10,
  },
  quoteAuthor: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DashboardScreen;