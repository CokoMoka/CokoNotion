// app/(tabs)/Mapa.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, getFontFamily } from '../../constants/theme';
import { 
  StudyPoint, 
  getStudyPoints, 
  saveStudyPoint, 
  deleteStudyPoint, 
  updateStudyPoint,
  initStudyPointsTable 
} from '../../services/database';
import { AppImages } from '@/constants/images';
import { useCompass } from '../../hooks/useCompass';
import  { useRef } from 'react';

const { width, height } = Dimensions.get("window");

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studyPoints, setStudyPoints] = useState<StudyPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<StudyPoint | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPointName, setNewPointName] = useState('');
  const [newPointNotes, setNewPointNotes] = useState('');
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [editingPoint, setEditingPoint] = useState<StudyPoint | null>(null);
  
  // 🔥 Estado para la brújula
  const { heading, direction, isAvailable, isCalibrating } = useCompass();
  const [showCompassHelp, setShowCompassHelp] = useState(true);
  const [showCompassDetails, setShowCompassDetails] = useState(false); // ✅ AÑADIR ESTE ESTADO
  
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const theme = Colors.dark;
  
  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Región inicial
  const initialRegion: Region = {
    latitude: 24.1426,
    longitude: -110.3126,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Cargar puntos de estudio
  const cargarPuntos = async () => {
    try {
      const points = await getStudyPoints();
      setStudyPoints(points);
    } catch (error) {
      console.error('Error al cargar puntos:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarPuntos();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    const init = async () => {
      await initStudyPointsTable();
      await cargarPuntos();
      
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
      setLoading(false);
    };
    
    init();
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarPuntos();
    }, [])
  );

  const handleMapPress = (event: any) => {
    const { coordinate } = event.nativeEvent;
    setTempLocation(coordinate);
    setNewPointName('');
    setNewPointNotes('');
    setModalVisible(true);
  };

  const handleMarkerPress = (point: StudyPoint) => {
    setSelectedPoint(point);
    mapRef.current?.animateToRegion({
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  };

  const handleSavePoint = async () => {
    if (!newPointName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el punto de estudio');
      return;
    }
    
    if (tempLocation) {
      const success = await saveStudyPoint({
        name: newPointName.trim(),
        latitude: tempLocation.latitude,
        longitude: tempLocation.longitude,
        notes: newPointNotes.trim() || undefined,
      });
      
      if (success) {
        await cargarPuntos();
        setModalVisible(false);
        setTempLocation(null);
        Alert.alert('Éxito', 'Punto de estudio guardado');
      } else {
        Alert.alert('Error', 'No se pudo guardar el punto');
      }
    }
  };

  const handleEditPoint = async () => {
    if (!editingPoint) return;
    if (!editingPoint.name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }
    
    const success = await updateStudyPoint(editingPoint.id, {
      name: editingPoint.name,
      notes: editingPoint.notes,
    });
    
    if (success) {
      await cargarPuntos();
      setEditModalVisible(false);
      setEditingPoint(null);
      Alert.alert('Éxito', 'Punto actualizado');
    } else {
      Alert.alert('Error', 'No se pudo actualizar el punto');
    }
  };

  const handleDeletePoint = async () => {
    if (!selectedPoint) return;
    
    Alert.alert(
      'Eliminar punto',
      `¿Estás seguro de eliminar "${selectedPoint.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteStudyPoint(selectedPoint.id);
            if (success) {
              await cargarPuntos();
              setSelectedPoint(null);
              Alert.alert('Éxito', 'Punto eliminado');
            } else {
              Alert.alert('Error', 'No se pudo eliminar el punto');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <ImageBackground
          source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#df96c0" />
                <Text style={styles.loadingText}>Cargando mapa...</Text>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ImageBackground
        source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <View style={styles.container}>
              
              {/* Header con botón de retroceso */}
              <View style={styles.header}>
               
                <Text style={[styles.headerTitle, font('rounded')]}>
                  Puntos de Estudio
                </Text>
                <View style={{ width: 40 }} />
              </View>
              
              <Text style={[styles.headerSubtitle, { color: '#b5b5b5' }, font('sans')]}>
                Toca el mapa para agregar un lugar de estudio
              </Text>

              {/* 🔥 BRÚJULA */}
              <View style={styles.compassContainer}>
                <TouchableOpacity 
                  style={styles.compassWidget} 
                  onPress={() => setShowCompassDetails(!showCompassDetails)}
                  activeOpacity={0.7}
                >
                  <View style={styles.compassWidgetInner}>
                    <View style={[styles.compassWidgetNeedle, { transform: [{ rotate: `${heading}deg` }] }]}>
                      <Text style={styles.compassWidgetArrow}>🧭</Text>
                    </View>
                    <Text style={styles.compassWidgetDirection}>{direction}</Text>
                  </View>
                </TouchableOpacity>

                {showCompassDetails && (
                  <View style={styles.compassDetails}>
                    <Text style={styles.compassDetailsTitle}>Brújula</Text>
                    <Text style={styles.compassDetailsDirection}>{direction}</Text>
                    <Text style={styles.compassDetailsHeading}>{Math.round(heading)}°</Text>
                    {isCalibrating && (
                      <Text style={styles.compassCalibrating}>Calibrando...</Text>
                    )}
                    {!isAvailable && (
                      <Text style={styles.compassUnavailable}>! Gira el teléfono</Text>
                    )}
                    {showCompassHelp && (
                      <TouchableOpacity onPress={() => setShowCompassHelp(false)}>
                        <Text style={styles.compassHelpClose}>✕ Cerrar ayuda</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>

              {/* Mapa */}
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={initialRegion}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  showsCompass={true}
                  onPress={handleMapPress}
                >
                  {studyPoints.map((point) => (
                    <Marker
                      key={point.id}
                      coordinate={{
                        latitude: point.latitude,
                        longitude: point.longitude,
                      }}
                      title={point.name}
                      description={point.notes || 'Lugar de estudio'}
                      pinColor="#df96c0"
                      onPress={() => handleMarkerPress(point)}
                    />
                  ))}
                </MapView>
              </View>

              {/* Panel de punto seleccionado */}
              {selectedPoint && (
                <View style={[styles.selectedCard, { 
                  backgroundColor: 'rgba(42, 47, 52, 0.95)', 
                  borderColor: '#343a40' 
                }]}>
                  <View style={styles.selectedHeader}>
                    <Text style={[styles.selectedName, { color: '#FFFFFF' }, font('rounded')]}>
                      {selectedPoint.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                      <Text style={[styles.closeIcon, { color: '#b5b5b5' }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedPoint.notes && (
                    <Text style={[styles.selectedNotes, { color: '#b5b5b5' }, font('sans')]}>
                      {selectedPoint.notes}
                    </Text>
                  )}
                  <View style={styles.selectedActions}>
                    <TouchableOpacity 
                      style={[styles.editButton, { borderColor: '#343a40' }]}
                      onPress={() => {
                        setEditingPoint(selectedPoint);
                        setEditModalVisible(true);
                        setSelectedPoint(null);
                      }}
                    >
                      <Text style={[styles.editButtonText, { color: "#df96c0" }]}>✎ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteButton, { borderColor: '#ff4444' }]}
                      onPress={handleDeletePoint}
                    >
                      <Text style={[styles.deleteButtonText, { color: '#ff4444' }]}>X Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Modales (agregar y editar) - mismos que ya tenías */}
              {/* ... resto de tu código ... */}
              
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  fullScreenBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImage: {
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginTop: 17,
    textAlign: "center"
  },
  headerSubtitle: {
    fontSize: 15,
    marginBottom: 12,
    textAlign: 'center',
  },
  // 🔥 Estilos de la brújula
  compassContainer: {
    position: 'absolute',
    top: 130,
    right: 18,
    zIndex: 10,
  },
  compassWidget: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 50,
    padding: 10,
    borderWidth: 1,
    borderColor: '#df96c0',
  },
  compassWidgetInner: {
    alignItems: 'center',
  },
  compassWidgetNeedle: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassWidgetArrow: {
    fontSize: 24,
  },
  compassWidgetDirection: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  compassDetails: {
    position: 'absolute',
    top: 70,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 12,
    padding: 12,
    width: 140,
    borderWidth: 1,
    borderColor: '#df96c0',
  },
  compassDetailsTitle: {
    color: '#df96c0',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  compassDetailsDirection: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  compassDetailsHeading: {
    color: '#b5b5b5',
    fontSize: 14,
    textAlign: 'center',
  },
  compassCalibrating: {
    color: '#FF9800',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  compassUnavailable: {
    color: '#ff4444',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  compassHelpClose: {
    color: '#888888',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  selectedCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  closeIcon: {
    fontSize: 18,
    padding: 4,
  },
  selectedNotes: {
    fontSize: 14,
    marginBottom: 12,
  },
  selectedActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Modales (agrega los estilos de tus modales aquí)
});

export default MapScreen;