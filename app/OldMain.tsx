// import { LinearGradient } from 'expo-linear-gradient';
// import React, { useEffect, useState, useCallback } from 'react';
// import {
//   ActivityIndicator,
//   Image,
//   ImageBackground,
//   Platform,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
//   RefreshControl,
// } from 'react-native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { Colors, getFontFamily } from '../constants/theme';
// import { useUser } from '../hooks/useUser';
// import { router } from 'expo-router';

// const DashboardScreen = () => {
//   const { user, loading, refreshUser } = useUser();
//   const [userName, setUserName] = useState("Estudiante");
//   const [refreshing, setRefreshing] = useState(false);
  
//   // Estado para datos que se pueden actualizar con el refresh
//   const [cita, setCita] = useState("La constancia es más importante que la intensidad");
//   const [autorCita, setAutorCita] = useState("Pomodoro");
//   const [estadisticas, setEstadisticas] = useState([
//     { label: 'Racha actual',
//       value: '${user?.racha || 0} días',
//       icon: '🔥' },
//     { label: 'Horas estudiadas', value: '${user?.horasEstudio || 0}h', icon: '⏰' },
//     { label: 'Tareas completadas', value: '${user?.tareasCompletadas || 0}', icon: '✅' },
//     { label: 'Recompensas', value: '${user?.recompensas || 0}', icon: '🏆' },
//   ]);

//   const theme = Colors.light;

//   const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
//     fontFamily: getFontFamily(Platform.OS, type),
//   });

//   const quickActions = [
//     { name: 'Notas', icon: 'ᝰ.ᐟ', color: theme.border, route: '/notes' },
//     { name: 'Flashcards', icon: '𖡎', color: theme.border, route: '/flashcards' },
//     { name: 'Temporizador', icon: '⏱', color: theme.border, route: '/timer' },
//     { name: 'Estadísticas', icon: 'ılı', color: theme.border, route: '/stats' },
//   ];

//   // Función para actualizar los datos desde Firestore
//   const actualizarDatosDesdeFirestore = useCallback(async () => {
//     if (!user) return;
//     const horasFormateadas = (user?.horasEstudio || 0).toFixed(1);
    
//     // Actualizar estadísticas con datos reales del usuario
//     setEstadisticas([

//       { label: 'Racha actual', value: `${user.racha || 0} días`, icon: '🔥' },
//       { label: 'Horas estudiadas', value: `${horasFormateadas}h`, icon: '⏰' },
//       { label: 'Tareas completadas', value: `${user.tareasCompletadas || 0}`, icon: '✅' },
//       { label: 'Recompensas', value: 'x', icon: '🏆' },
//     ]);
    
//     // Actualizar frases motivacionales (puedes tener un array de frases)
//     const frases = [
//       { texto: "La constancia es más importante que la intensidad", autor: "Pomodoro" },
//       { texto: "El éxito es la suma de pequeños esfuerzos repetidos día tras día", autor: "Robert Collier" },
//       { texto: "No tienes que ser genial para empezar, pero tienes que empezar para ser genial", autor: "Zig Ziglar" },
//       { texto: "El estudio no se mide por el tiempo, sino por la dedicación", autor: "Anónimo" },
//       { texto: "Cada pomodoro es un paso más cerca de tus metas", autor: "CokoNotion" },
//     ];
//     const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
//     setCita(fraseAleatoria.texto);
//     setAutorCita(fraseAleatoria.autor);
//   }, [user]);

//   // Función de refresco al hacer pull-down
//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);
//     try {
//       // Refrescar datos del usuario desde Firestore
//       await refreshUser();
      
//       // Actualizar el nombre mostrado
//       if (user?.displayName) {
//         setUserName(user.displayName);
//       }
      
//       // Actualizar estadísticas y frases
//       await actualizarDatosDesdeFirestore();
      
//       console.log('✅ Pantalla refrescada correctamente');
//     } catch (error) {
//       console.error('❌ Error al refrescar:', error);
//     } finally {
//       setRefreshing(false);
//     }
//   }, [refreshUser, user, actualizarDatosDesdeFirestore]);

//   // Cargar nombre y datos iniciales
//   useEffect(() => {
//     if (user?.displayName) {
//       setUserName(user.displayName);
//     }
//     if (user) {
//       actualizarDatosDesdeFirestore();
//     }
//   }, [user, actualizarDatosDesdeFirestore]);

//   const handleNavigation = (route: string) => {
//     router.push(route);
//   };

//   if (loading) {
//     return (
//       <SafeAreaProvider>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#df96c0" />
//         </View>
//       </SafeAreaProvider>
//     );
//   }

//   return (
//     <SafeAreaProvider>
//       <ImageBackground
//         source={require('../../assets/images/bD.jpg')}
//         style={styles.backgroundImage}
//         resizeMode="cover"
//       >
//         <View style={styles.overlay}>
//           <SafeAreaView style={styles.safeArea}>
//             <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
//             <ScrollView 
//               contentContainerStyle={styles.scrollContainer}
//               showsVerticalScrollIndicator={false}
//               refreshControl={
//                 <RefreshControl
//                   refreshing={refreshing}
//                   onRefresh={onRefresh}
//                   colors={['#df96c0', '#FF9F4A']}  // Android: colores del spinner
//                   tintColor="#df96c0"              // iOS: color del spinner
//                   title="Actualizando..."          // iOS: texto mientras carga
//                   titleColor="#ffffff"             // iOS: color del texto
//                   progressBackgroundColor="rgba(0,0,0,0.3)" // Fondo del spinner
//                 />
//               }
//             >
//               <View style={styles.container}>
//                 {/* BANNER CON DEGRADADO */}
//                 <View style={styles.bannerWrapper}>
//                   <View style={styles.bannerContainer}>
//                     <Image
//                       source={require('../../assets/images/aD.jpg')}
//                       style={styles.bannerImage}
//                       resizeMode="cover"
//                     />
//                     <LinearGradient
//                       colors={['transparent', theme.background]}
//                       style={styles.bannerGradientExtra}
//                       start={{ x: 0, y: 0 }}
//                       end={{ x: 0, y: 1 }}
//                     />
//                     <View style={styles.bannerOverlay}>
//                       <Text style={[styles.bannerTitle, font('rounded')]}>
//                         Inicio
//                       </Text>
//                       <Text style={[styles.bannerSubtitle, font('sans')]}>
//                         Bienvenido a tu espacio 
//                       </Text>
//                     </View>
//                   </View>
//                 </View>

//                 {/* Header con información del usuario */}
//                 <View style={styles.header}>
//                   <View style={styles.headerLeft}>
//                     <View style={styles.bearIconContainer}>
//                       <Text style={styles.bearIcon}>🐕</Text>
//                     </View>
//                     <View>
//                       <Text style={[styles.greeting, font('rounded')]}>
//                         ¡Hola, {userName}!
//                       </Text>
//                       <Text style={[styles.date, font('sans')]}>
//                         {new Date().toLocaleDateString('es-ES', { 
//                           weekday: 'long', 
//                           year: 'numeric', 
//                           month: 'long', 
//                           day: 'numeric' 
//                         })}
//                       </Text>
//                     </View>
//                   </View>
//                   <View style={styles.headerIcons}>
//                     <TouchableOpacity style={styles.iconButton}>
//                       <Text style={styles.icon}>⢰</Text>
//                     </TouchableOpacity>
//                   </View>
//                 </View>

//                 {/* Próximas Tareas */}
//                 <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
//                   Próximas Tareas
//                 </Text>
//                 <View style={[styles.tasksCard, { 
//                   backgroundColor: theme.background,
//                   borderColor: theme.border,
//                 }]}>
//                   <View style={styles.taskItem}>
//                     <View style={[styles.taskCheckbox, { borderColor: theme.bearPrimary }]} />
//                     <View style={styles.taskContent}>
//                       <Text style={[styles.taskTitle, { color: theme.text }, font('sans')]}>
//                         Estudiar React Native
//                       </Text>
//                       <Text style={[styles.taskTime, { color: theme.textMuted }, font('sans')]}>
//                         Hoy, 6:00 PM
//                       </Text>
//                     </View>
//                     <Text style={[styles.taskSubject, { color: theme.text }, font('sans')]}>
//                       Programación
//                     </Text>
//                   </View>

//                   <View style={[styles.taskDivider, { backgroundColor: theme.border }]} />

//                   <View style={styles.taskItem}>
//                     <View style={[styles.taskCheckbox, { borderColor: theme.bearPrimary }]} />
//                     <View style={styles.taskContent}>
//                       <Text style={[styles.taskTitle, { color: theme.text }, font('sans')]}>
//                         Hacer Flashcards
//                       </Text>
//                       <Text style={[styles.taskTime, { color: theme.textMuted }, font('sans')]}>
//                         Mañana, 10:00 AM
//                       </Text>
//                     </View>
//                     <Text style={[styles.taskSubject, { color: theme.text }, font('sans')]}>
//                       Estudio
//                     </Text>
//                   </View>
//                 </View>

//                 {/* Quick Actions */}
//                 <Text style={[styles.sectionTitle, { color: '#ffffff' }, font('rounded')]}>
//                   Acciones Rápidas
//                 </Text>
//                 <View style={styles.quickActionsGrid}>
//                   {quickActions.map((action, index) => (
//                     <TouchableOpacity 
//                       key={index} 
//                       style={[styles.actionCard, { 
//                           backgroundColor: theme.background,
//                           borderColor: theme.border,
//                       }]}
//                       onPress={() => handleNavigation(action.route)}
//                     >
//                       <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
//                         <Text style={styles.actionIcon}>{action.icon}</Text>
//                       </View>
//                       <Text style={[styles.actionName, { color: theme.text }, font('sans')]}>
//                         {action.name}
//                       </Text>
//                     </TouchableOpacity>
//                   ))}
//                 </View>

//                 {/* Frase motivacional */}
//                 <View style={[styles.quoteCard, { 
//                   backgroundColor: theme.background,
//                   borderColor: theme.border,
//                 }]}>
//                   <Text style={styles.quoteIcon}>🐶</Text>
//                   <Text style={[styles.quoteText, { color: theme.textSecondary }, font('sans')]}>
//                     {cita}
//                   </Text>
//                   <Text style={[styles.quoteAuthor, { color: theme.text }, font('rounded')]}>
//                     — {autorCita}
//                   </Text>
//                 </View>

//                 {/* Stats Cards */}
//                 <View style={styles.statsContainer}>
//                   {estadisticas.map((stat, index) => (
//                     <View key={index} style={[styles.statCard, { 
//                       backgroundColor: theme.background,
//                       borderColor: theme.border,
//                     }]}>
//                       <Text style={styles.statIcon}>{stat.icon}</Text>
//                       <Text style={[styles.statValue, { color: theme.text }, font('rounded')]}>
//                         {stat.value}
//                       </Text>
//                       <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
//                         {stat.label}
//                       </Text>
//                     </View>
//                   ))}
//                 </View>
//               </View>
//             </ScrollView>
//           </SafeAreaView>
//         </View>
//       </ImageBackground>
//     </SafeAreaProvider>
//   );
// };

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#1a1a2e',
//   },
//   backgroundImage: {
//     flex: 1,
//     width: '100%',
//     height: '100%',
//   },
//   overlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.3)',
//   },
//   safeArea: {
//     flex: 1,
//   },
//   scrollContainer: {
//     flexGrow: 1,
//   },
//   container: {
//     flex: 1,
//     paddingHorizontal: 20,
//     paddingTop: 10,
//     paddingBottom: 20,
//   },
//   bannerWrapper: {
//     marginHorizontal: -20,
//     marginBottom: -30,
//     marginTop: -10,
//   },
//   bannerContainer: {
//     height: 200,
//     width: '100%',
//     overflow: 'hidden',
//     position: 'relative',
//     backgroundColor: '#ff009900',
//   },
//   bannerImage: {
//     width: '100%',
//     height: '100%',
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//   },
//   bannerGradientExtra: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     zIndex: 2,
//   },
//   bannerOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     paddingHorizontal: 20,
//     paddingVertical: 4,
//     zIndex: 3,
//   },
//   bannerTitle: {
//     fontSize: 32,
//     fontWeight: '700',
//     color: '#ffffff',
//     textShadowColor: 'rgba(0,0,0,0.4)',
//     textShadowOffset: { width: 2, height: 2 },
//     textShadowRadius: 4,
//     marginBottom: 4,
//   },
//   bannerSubtitle: {
//     fontSize: 16,
//     marginTop: -7,
//     marginBottom: 10,
//     fontWeight: '500',
//     color: '#ffffff',
//     textShadowColor: 'rgba(0,0,0,0.4)',
//     textShadowOffset: { width: 2, height: 2 },
//     textShadowRadius: 4,
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: 45,
//     marginBottom: 20,
//   },
//   headerLeft: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   bearIconContainer: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: 'rgba(255, 255, 255, 0.08)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 12,
//     borderWidth: 2,
//     borderColor: '#ffffff4b',
//   },
//   bearIcon: {
//     fontSize: 30,
//     backgroundColor: 'transparent',
//   },
//   greeting: {
//     fontSize: 20,
//     fontWeight: '700',
//     color: '#ffffff',
//     marginBottom: 2,
//     textShadowColor: 'rgba(0,0,0,0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   date: {
//     fontSize: 12,
//     color: '#ffffff',
//     opacity: 0.9,
//     textShadowColor: 'rgba(0,0,0,0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   headerIcons: {
//     flexDirection: 'row',
//   },
//   iconButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: 'rgba(255, 255, 255, 0)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginLeft: 8,
//   },
//   icon: {
//     fontSize: 30,
//   },
//   statsContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   statCard: {
//     width: '48%',
//     padding: 16,
//     borderRadius: 20,
//     alignItems: 'center',
//     marginBottom: 10,
//     borderWidth: 1,
//   },
//   statIcon: {
//     fontSize: 28,
//     marginBottom: 8,
//   },
//   statValue: {
//     fontSize: 22,
//     fontWeight: '600',
//     marginBottom: 4,
//   },
//   statLabel: {
//     fontSize: 12,
//     textAlign: 'center',
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: '700',
//     marginBottom: 15,
//     textShadowColor: 'rgba(0,0,0,0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//   },
//   quickActionsGrid: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'space-between',
//     marginBottom: 20,
//   },
//   actionCard: {
//     width: '48%',
//     padding: 16,
//     borderRadius: 20,
//     alignItems: 'center',
//     marginBottom: 10,
//     borderWidth: 1,
//   },
//   actionIconContainer: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginBottom: 10,
//   },
//   actionIcon: {
//     fontSize: 30,
//   },
//   actionName: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   tasksCard: {
//     borderRadius: 20,
//     padding: 16,
//     marginBottom: 20,
//     borderWidth: 1,
//   },
//   taskItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 8,
//   },
//   taskCheckbox: {
//     width: 22,
//     height: 22,
//     borderRadius: 11,
//     borderWidth: 2,
//     marginRight: 12,
//   },
//   taskContent: {
//     flex: 1,
//   },
//   taskTitle: {
//     fontSize: 15,
//     fontWeight: '500',
//     marginBottom: 2,
//   },
//   taskTime: {
//     fontSize: 12,
//   },
//   taskSubject: {
//     fontSize: 12,
//     fontWeight: '500',
//   },
//   taskDivider: {
//     height: 1,
//     width: '100%',
//     marginVertical: 8,
//   },
//   quoteCard: {
//     borderRadius: 20,
//     padding: 20,
//     marginBottom: 20,
//     borderWidth: 1,
//     alignItems: 'center',
//   },
//   quoteIcon: {
//     fontSize: 30,
//     marginBottom: 10,
//   },
//   quoteText: {
//     fontSize: 16,
//     fontStyle: 'italic',
//     textAlign: 'center',
//     lineHeight: 22,
//     marginBottom: 10,
//   },
//   quoteAuthor: {
//     fontSize: 14,
//     fontWeight: '500',
//   },
// });

// export default DashboardScreen;