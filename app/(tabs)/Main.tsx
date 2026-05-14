// DashboardScreen.tsx
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
import { getUserAvatar, getUserBanner, getUserBackground } from '../../services/avatarService';
import { getUserPhrase } from '../../services/auth';
import { getAllNotes, Note } from '../../services/database';
import WeatherWidget from '../../components/WeatherWidget';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuración de texto estático del nuevo diseño
 */
const SCREEN_TEXT = {
  navLetters: ['ᝰ.ᐟ', '𖡎', '⏱', 'ılı', '𐀪'] as const,
  tasksSectionTitle: 'Próximas Tareas',
} as const;

// Mapeo de íconos a rutas de navegación
const NAV_ACTIONS = [
  { name: 'Notas', icon: 'ᝰ.ᐟ', route: '/NotasN' },
  { name: 'Flashcards', icon: '𖡎', route: '/FeedFlashCards' },
  { name: 'Temporizador', icon: '⏱', route: '/PomSetup' },
  { name: 'Estadísticas', icon: 'ılı', route: '/EstadisticasN' },
  { name: 'Configuración', icon: '𐀪', route: '/ProfileN' },
] as const;

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;

  const { user, loading, refreshUser } = useUser();
  const [userName, setUserName] = useState("Estudiante");
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para frases motivacionales
  const [cita, setCita] = useState("Dream Big Work Hard!");
  const [autorCita, setAutorCita] = useState("Pomodoro");
  
  // Estados para imágenes del usuario
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  
  // Estado para tareas reales
  const [recentTasks, setRecentTasks] = useState<Note[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  
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

  // 🔥 Función para cargar el nombre desde AsyncStorage
  const cargarNombreDesdeStorage = useCallback(async () => {
    try {
      if (user?.uid) {
        const nombreGuardado = await AsyncStorage.getItem(`userName_${user.uid}`);
        if (nombreGuardado) {
          setUserName(nombreGuardado);
          console.log('✅ Nombre cargado desde AsyncStorage:', nombreGuardado);
        } else if (user?.displayName) {
          // Si no hay en AsyncStorage, usar el de Firebase y guardarlo
          setUserName(user.displayName);
          await AsyncStorage.setItem(`userName_${user.uid}`, user.displayName);
        }
      }
    } catch (error) {
      console.error('Error al cargar nombre desde AsyncStorage:', error);
      // Fallback: usar el nombre de Firebase si hay error
      if (user?.displayName) {
        setUserName(user.displayName);
      }
    }
  }, [user]);

  // 🔥 Función para cargar tareas pendientes (solo NO completadas)
  const cargarTareasPendientes = useCallback(async () => {
    try {
      setLoadingTasks(true);
      const todasLasNotas = await getAllNotes();
      
      // Filtrar solo tareas (type === 'tarea') y que NO estén completadas
      const tareas = todasLasNotas
        .filter(note => note.type === 'tarea')
        .filter(note => {
          if (!note.tasks || note.tasks.length === 0) {
            return true;
          }
          // Verificar si todas las subtareas están completadas
          const allCompleted = note.tasks.every((task: any) => {
            if (typeof task === 'object') {
              return task.completed === true;
            }
            return false;
          });
          return !allCompleted;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3);
      
      setRecentTasks(tareas);
    } catch (error) {
      console.error('Error al cargar tareas:', error);
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  // Función para cargar imágenes del usuario
  const cargarImagenesUsuario = useCallback(async () => {
    if (!user?.uid) return;
    
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
    }
  }, [user?.uid]);

  // Función para actualizar datos desde Firestore
  const actualizarDatosDesdeFirestore = useCallback(async () => {
    if (!user) return;
    
    const horasFormateadas = (user?.horasEstudio || 0).toFixed(1);
     
    setEstadisticas([
      { label: 'Racha actual', value: `${user.racha || 0} días`, icon: '🙊' },
      { label: 'Horas estudiadas', value: `${horasFormateadas}h`, icon: '🙉' },
      { label: 'Tareas completadas', value: `${user.tareasCompletadas || 0}`, icon: '🙈' }
    ]);
    
    // Cargar frase personalizada
    const fraseData = await getUserPhrase(user.uid);
    if (fraseData) {
      setCita(fraseData.frase);
      setAutorCita(fraseData.autor);
    }
  }, [user]);

  // Función de refresco al hacer pull-down
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await cargarNombreDesdeStorage(); // 🔥 Recargar nombre desde AsyncStorage
      await Promise.all([
        actualizarDatosDesdeFirestore(),
        cargarImagenesUsuario(),
        cargarTareasPendientes(),
      ]);
      console.log('✅ Pantalla refrescada correctamente');
    } catch (error) {
      console.error('❌ Error al refrescar:', error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshUser, cargarNombreDesdeStorage, actualizarDatosDesdeFirestore, cargarImagenesUsuario, cargarTareasPendientes]);

  // Cargar datos iniciales
  useEffect(() => {
    if (user) {
      cargarNombreDesdeStorage(); // 🔥 Cargar nombre desde AsyncStorage
      actualizarDatosDesdeFirestore();
      cargarImagenesUsuario();
      cargarTareasPendientes();
    }
  }, [user, cargarNombreDesdeStorage, actualizarDatosDesdeFirestore, cargarImagenesUsuario, cargarTareasPendientes]);

  // 🔥 Función para obtener el texto de la primera tarea
  const getFirstTaskText = (tasks: any[]): string => {
    if (!tasks || tasks.length === 0) return '';
    const firstTask = tasks[0];
    if (typeof firstTask === 'object' && firstTask.text) {
      return firstTask.text;
    }
    if (typeof firstTask === 'string') {
      return firstTask;
    }
    return '';
  };

  // 🔥 Función para contar tareas pendientes
  const getPendingTasksCount = (tasks: any[]): number => {
    if (!tasks || tasks.length === 0) return 0;
    if (tasks[0] && typeof tasks[0] === 'object' && 'completed' in tasks[0]) {
      return tasks.filter(t => !t.completed).length;
    }
    return tasks.length;
  };

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
        source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
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
              {/* BANNER DE PORTADA */}
              <View style={styles.bannerWrapper}>
                <ImageBackground
                  source={bannerUrl ? { uri: bannerUrl } : AppImages.banner || require('../../assets/images/aD.jpg')}
                  resizeMode="cover"
                  style={[styles.banner, { height: s(135) }]}
                />
              </View>

              {/* HEADER con avatar */}
              <View style={styles.headerWrap}>
                <View style={[styles.headerOverlap, { marginTop: s(-30), paddingHorizontal: s(16) }]}>
                  <View style={[styles.avatar, { width: s(92), height: s(92), borderRadius: s(46), borderWidth: s(0) }]}>
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
                    ) : (
                      <Image source={AppImages.icon} style={styles.avatarImage} resizeMode="cover" />
                    )}
                  </View>

                  {/* Burbuja con frase motivacional */}
                  <View style={styles.bubbleContainer}>
                    <View style={[styles.bubbleTail1, { width: s(24), height: s(24), borderRadius: s(12), left: s(-6), top: s(-6) }]} />
                    <View style={[styles.bubbleTail2, { width: s(10), height: s(10), borderRadius: s(6), left: s(-13), top: s(-11) }]} />
                    
                    <View style={styles.bubble}>
                      <Text
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                        style={[styles.bubbleText, { fontSize: s(16) }]}>
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

              {/* PRÓXIMAS TAREAS */}
              <Text style={[styles.sectionTitle, { paddingHorizontal: s(16), marginTop: s(15), fontSize: s(18) }]}>
                {SCREEN_TEXT.tasksSectionTitle}
              </Text>

              {/* TAREAS REALES */}
              <View style={[styles.tasksList, { paddingHorizontal: s(16), marginTop: s(8), gap: s(7), marginBottom: s(12) }]}>
                {loadingTasks ? (
                  <View style={{ alignItems: 'center', paddingVertical: s(20) }}>
                    <ActivityIndicator size="small" color="#df96c0" />
                    <Text style={{ color: "#888888", marginTop: s(8), fontSize: s(12) }}>Cargando tareas...</Text>
                  </View>
                ) : recentTasks.length > 0 ? (
                  recentTasks.map((tarea) => {
                    const pendingCount = tarea.tasks ? getPendingTasksCount(tarea.tasks) : 0;
                    const firstTaskText = tarea.tasks ? getFirstTaskText(tarea.tasks) : '';
                    const allCompleted = tarea.tasks ? tarea.tasks.every((t: any) => t.completed === true) : false;
                    const taskEmoji = tarea.emoji || (tarea.type === 'tarea' ? '✅' : '📝');
                    
                    return (
                      <TouchableOpacity
                        key={tarea.id}
                        activeOpacity={0.7}
                        onPress={() => router.push({ pathname: '/NotaEj', params: { id: tarea.id } })}
                        style={[
                          styles.taskRow,
                          {
                            borderRadius: s(18),
                            paddingVertical: s(14),
                            paddingHorizontal: s(14),
                            opacity: allCompleted ? 0.6 : 1,
                          },
                        ]}>
                        <Text style={[styles.taskEmoji, { fontSize: s(24), marginRight: s(12) }]}>
                          {taskEmoji}
                        </Text>
                        <View style={{ marginLeft: s(12), flex: 1 }}>
                          <Text style={[styles.taskTitle, { fontSize: s(16), textDecorationLine: allCompleted ? 'line-through' : 'none' }]} numberOfLines={1}>
                            {tarea.title}
                          </Text>
                          <Text style={[styles.taskTime, { fontSize: s(13), marginTop: s(4) }]}>
                            {tarea.date}
                          </Text>
                          {tarea.tasks && tarea.tasks.length > 0 && !allCompleted && (
                            <Text style={[styles.taskPreview, { fontSize: s(11), color: "#737373", marginTop: s(4) }]} numberOfLines={1}>
                              {pendingCount > 0 ? `≔ ${firstTaskText.substring(0, 30)}` : `✓ Completando...`}
                              {pendingCount > 1 ? ` +${pendingCount - 1} más` : ''}
                            </Text>
                          )}
                          {allCompleted && (
                            <Text style={[styles.taskPreview, { fontSize: s(11), color: "#4CAF50", marginTop: s(4) }]} numberOfLines={1}>
                              ✓ ¡Tarea completada!
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={[styles.emptyTasksRow, {
                    borderRadius: s(18),
                    paddingVertical: s(20),
                    paddingHorizontal: s(14),
                    alignItems: 'center',
                    backgroundColor: '#2a2f34',
                  }]}>
                    <Text style={{ color: "#888888", fontSize: s(14), textAlign: 'center', width: '100%' }}>
                      🎉 ¡Todas las tareas completadas!
                    </Text>
                    <Text style={{ color: "#666666", fontSize: s(12), marginTop: s(4), textAlign: 'center', width: '100%' }}>
                      Buen trabajo, sigue así
                    </Text>
                  </View>
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
                      <Text style={[styles.statIcon, { fontSize: s(42), marginBottom: s(8) }]}>{stat.icon}</Text>
                      <Text style={[styles.statValue, { fontSize: s(25), marginTop: s(4), color: '#ffffff', fontWeight: '800' }]}>
                        {stat.value}
                      </Text>
                      <Text style={[styles.statLabel, { fontSize: s(15), marginTop: s(6), color: '#b5b5b5' }]}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* COMPONENTE DE CLIMA */}
              <WeatherWidget />
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
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  bubbleContainer: {
    marginLeft: 14,
    flexShrink: 1,
    maxWidth: '80%',
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
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
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
  taskEmoji: {
    textAlign: 'center',
  },
  taskTitle: {
    color: '#ffffff',
    fontWeight: '800',
  },
  taskTime: {
    color: '#b5b5b5',
    fontWeight: '600',
  },
  taskPreview: {
    color: '#737373',
  },
  emptyTasksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2f34',
    borderWidth: 1,
    borderColor: '#343a40',
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