import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState, useCallback } from 'react';
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
  View,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, getFontFamily } from '../../constants/theme';
import { useUser } from '../../hooks/useUser';
import { AppImages } from '../../constants/images';

/**
 * Configuración de texto estático del nuevo diseño
 */
const SCREEN_TEXT = {
  navLetters: ['ᝰ.ᐟ', '𖡎', '⏱', 'ılı', '𐀪'] as const,
  tasksSectionTitle: 'Próximas Tareas',
} as const;

// Mapeo de íconos a rutas de navegación
const NAV_ACTIONS = [
  { name: 'Notas', icon: 'ᝰ.ᐟ', route: '/Notas' },
  { name: 'Flashcards', icon: '𖡎', route: '/FeedFlashCards' },
  { name: 'Temporizador', icon: '⏱', route: '/PomSetup' },
  { name: 'Estadísticas', icon: 'ılı', route: '/EstadisticasN' },
  { name: 'Configuración', icon: '𐀪', route: '/Perfil' },
] as const;

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;

  const { user, loading, refreshUser } = useUser();
  const [userName, setUserName] = useState("Estudiante");
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para frases motivacionales
  const [cita, setCita] = useState("La constancia es más importante que la intensidad");
  const [autorCita, setAutorCita] = useState("Pomodoro");
  
  // Estado para estadísticas dinámicas
  const [estadisticas, setEstadisticas] = useState([
    { label: 'Racha actual', value: '0 días', icon: '🌺' },
    { label: 'Horas estudiadas', value: '0h', icon: '📓' },
    { label: 'Tareas completadas', value: '0', icon: '✅' },
    { label: 'Recompensas', value: '0', icon: '🏆' },
  ]);

  const theme = Colors.light;
  const greeting = `¡Hola, ${userName}!`;

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Función para actualizar datos desde Firestore
  const actualizarDatosDesdeFirestore = useCallback(async () => {
    if (!user) return;
    
    const horasFormateadas = (user?.horasEstudio || 0).toFixed(1);
    
    // Actualizar estadísticas con datos reales
    setEstadisticas([
      { label: 'Racha actual', value: `${user.racha || 0} días`, icon: '🌺' },
      { label: 'Horas estudiadas', value: `${horasFormateadas}h`, icon: '📓' },
      { label: 'Tareas completadas', value: `${user.tareasCompletadas || 0}`, icon: '✅' },
      { label: 'Recompensas', value: `${user.recompensas || 0}`, icon: '🏆' },
    ]);
    
    // Actualizar frase motivacional aleatoria
    const frases = [
      { texto: "Work Hard!", autor: "CokoNotion" },
    ];
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    setCita(fraseAleatoria.texto);
    setAutorCita(fraseAleatoria.autor);
  }, [user]);

  // Función de refresco al hacer pull-down
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      if (user?.displayName) {
        setUserName(user.displayName);
      }
      await actualizarDatosDesdeFirestore();
      console.log('✅ Pantalla refrescada correctamente');
    } catch (error) {
      console.error('❌ Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, user, actualizarDatosDesdeFirestore]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user?.displayName) {
      setUserName(user.displayName);
    }
    if (user) {
      actualizarDatosDesdeFirestore();
    }
  }, [user, actualizarDatosDesdeFirestore]);

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#df96c0" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: s(28) }]}
              showsVerticalScrollIndicator={false}
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
              {/* BANNER NUEVO - Solo la imagen, sin texto */}
              <View style={styles.bannerWrapper}>
                <ImageBackground
                  source={AppImages.banner}
                  resizeMode="cover"
                  style={[styles.banner, { height: s(120) }]}
                />
              </View>

              {/* HEADER con avatar y burbuja - MODIFICADO: burbuja ajustada al texto */}
              <View style={styles.headerWrap}>
                <View style={[styles.headerOverlap, { marginTop: s(-30), paddingHorizontal: s(16) }]}>
                  <View style={[styles.avatar, { width: s(92), height: s(92), borderRadius: s(46), borderWidth: s(3) }]}>
                    <Image source={AppImages.icon} style={styles.avatarImage} resizeMode="cover" />
                  </View>

                  {/* Burbuja con ancho dinámico - AHORA SE AJUSTA AL TEXTO */}
                  <View style={styles.bubbleContainer}>
                    {/* Colas de la burbuja */}
                    <View style={[styles.bubbleTail1, { width: s(24), height: s(24), borderRadius: s(12), left: s(-6), top: s(-6) }]} />
                    <View style={[styles.bubbleTail2, { width: s(10), height: s(10), borderRadius: s(6), left: s(-13), top: s(-11) }]} />
                    
                    {/* Cuerpo de la burbuja - ancho automático */}
                    <View style={styles.bubble}>
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                        style={[styles.bubbleText, { fontSize: s(18) }]}>
                        {cita}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* BOTONES DE NAVEGACIÓN */}
              <View style={[styles.navRow, { paddingHorizontal: s(16), marginTop: s(16), gap: s(10) }]}>
                {NAV_ACTIONS.map((action, index) => (
                  <TouchableOpacity
                    key={`${action.icon}-${index}`}
                    activeOpacity={0.65}
                    accessibilityRole="button"
                    accessibilityLabel={`Botón ${action.name}`}
                    onPress={() => handleNavigation(action.route)}
                    style={[
                      styles.navButton,
                      {
                        width: s(62),
                        height: s(62),
                        borderRadius: s(16),
                      },
                    ]}>
                    <Text style={[styles.navLetter, { fontSize: s(28) }]}>{action.icon}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* SALUDO */}
              <Text style={[styles.greeting, { paddingHorizontal: s(16), marginTop: s(18), fontSize: s(28) }]}>
                {greeting}
              </Text>

              {/* FECHA ACTUAL */}
              <Text style={[styles.dateText, { paddingHorizontal: s(16), marginTop: s(4), fontSize: s(14) }]}>
                {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>

              {/* PRÓXIMAS TAREAS - Título */}
              <Text style={[styles.sectionTitle, { paddingHorizontal: s(16), marginTop: s(18), fontSize: s(18) }]}>
                {SCREEN_TEXT.tasksSectionTitle}
              </Text>

              {/* TAREAS */}
              <View style={[styles.tasksList, { paddingHorizontal: s(16), marginTop: s(12), gap: s(12) }]}>
                {user?.tareas?.length > 0 ? (
                  user.tareas.slice(0, 3).map((tarea: any, index: number) => (
                    <TouchableOpacity
                      key={tarea.id || index}
                      activeOpacity={0.7}
                      onPress={() => console.log(`Tarea: ${tarea.title}`)}
                      style={[
                        styles.taskRow,
                        {
                          borderRadius: s(18),
                          paddingVertical: s(14),
                          paddingHorizontal: s(14),
                        },
                      ]}>
                      <View style={[styles.taskCheckbox, { width: s(24), height: s(24), borderRadius: s(12), borderWidth: 2, borderColor: '#df96c0' }]} />
                      <View style={{ marginLeft: s(12), flex: 1 }}>
                        <Text style={[styles.taskTitle, { fontSize: s(16) }]}>{tarea.title || 'Tarea pendiente'}</Text>
                        <Text style={[styles.taskTime, { fontSize: s(13), marginTop: s(4) }]}>
                          {tarea.fecha || new Date().toLocaleDateString()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  [
                    { title: 'Estudiar React Native', time: 'Hoy, 6:00 PM' },
                    { title: 'Hacer Flashcards', time: 'Mañana, 10:00 AM' },
                    { title: 'Completar proyecto', time: 'Vie, 3:00 PM' },
                  ].map((task, index) => (
                    <View
                      key={index}
                      style={[
                        styles.taskRow,
                        {
                          borderRadius: s(18),
                          paddingVertical: s(14),
                          paddingHorizontal: s(14),
                        },
                      ]}>
                      <View style={[styles.taskCheckbox, { width: s(24), height: s(24), borderRadius: s(12), borderWidth: 2, borderColor: '#df96c0' }]} />
                      <View style={{ marginLeft: s(12), flex: 1 }}>
                        <Text style={[styles.taskTitle, { fontSize: s(16) }]}>{task.title}</Text>
                        <Text style={[styles.taskTime, { fontSize: s(13), marginTop: s(4) }]}>{task.time}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>

              {/* ESTADÍSTICAS */}
              <View
                style={[
                  styles.statsCard,
                  {
                    marginHorizontal: s(16),
                    marginTop: s(18),
                    borderRadius: s(22),
                    paddingVertical: s(16),
                    paddingHorizontal: s(12),
                    marginBottom: s(20),
                  },
                ]}>
                <View style={styles.statsRow}>
                  {estadisticas.map((stat, index) => (
                    <View key={index} style={styles.statCol}>
                      <Text style={[styles.statIcon, { fontSize: s(28), marginBottom: s(8) }]}>{stat.icon}</Text>
                      <Text style={[styles.statValue, { fontSize: s(20), marginTop: s(4), color: '#ffffff', fontWeight: '800' }]}>
                        {stat.value}
                      </Text>
                      <Text style={[styles.statLabel, { fontSize: s(11), marginTop: s(6), color: '#b5b5b5' }]}>
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
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
  },
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
  scrollContent: {
    flexGrow: 1,
  },
  bannerWrapper: {
    width: '100%',
  },
  banner: {
    width: '100%',
  },
  headerWrap: {
    width: '100%',
  },
  headerOverlap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    overflow: 'hidden',
    borderColor: '#ffffff',
    backgroundColor: '#111',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  // NUEVO: contenedor de la burbuja con ancho ajustado al contenido
  bubbleContainer: {
    marginLeft: 14,
    flexShrink: 1,        // Permite que se encoja si es necesario
    maxWidth: '80%',      // Límite máximo para no ocupar toda la pantalla
  },
  bubbleTail1: {
    position: 'absolute',
    backgroundColor: '#f3f3f3',
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  bubbleTail2: {
    position: 'absolute',
    backgroundColor: '#f3f3f3',
    transform: [{ rotate: '45deg' }],
    zIndex: 1,
  },
  bubble: {
    backgroundColor: '#f3f3f3',
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 18,  // Padding horizontal reducido para menos espacio de sobra
    alignSelf: 'flex-start', // IMPORTANTE: hace que la burbuja se ajuste al texto
  },
  bubbleText: {
    color: '#000000',
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    backgroundColor: '#2a2f34',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#343a40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  navLetter: {
    color: '#ffffff',
    fontWeight: '800',
  },
  greeting: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dateText: {
    color: '#ffffff',
    opacity: 0.8,
  },
  sectionTitle: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tasksList: {},
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2f34',
    borderWidth: 1,
    borderColor: '#343a40',
  },
  taskCheckbox: {
    backgroundColor: 'transparent',
  },
  taskTitle: {
    color: '#ffffff',
    fontWeight: '800',
  },
  taskTime: {
    color: '#b5b5b5',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#2a2f34',
    borderWidth: 1,
    borderColor: '#343a40',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    width: '23%',
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontWeight: '800',
  },
  statLabel: {
    fontWeight: '600',
    textAlign: 'center',
  },
});