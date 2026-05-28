import { AppImages } from '@/constants/images';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  TextInput
} from 'react-native';
import MapView, { Marker, Region, MapPressEvent } from 'react-native-maps';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../../constants/theme';
import { useCompass } from '../../hooks/useCompass';
import {
  StudyPoint,
  deleteStudyPoint,
  getStudyPoints,
  initStudyPointsTable,
  saveStudyPoint,
  updateStudyPoint
} from '../../services/database';

const { width, height } = Dimensions.get("window");

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studyPoints, setStudyPoints] = useState<StudyPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<StudyPoint | null>(null);
  
  // Modales controlados estrictamente por JS
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  
  const [newPointName, setNewPointName] = useState('');
  const [newPointNotes, setNewPointNotes] = useState('');
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [editingPoint, setEditingPoint] = useState<StudyPoint | null>(null);
  
  // Brújula
  const { heading, direction, isAvailable, isCalibrating } = useCompass();
  const [showCompassHelp, setShowCompassHelp] = useState(true);
  const [showCompassDetails, setShowCompassDetails] = useState(false);
  
  const mapRef = useRef<MapView>(null);
  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const initialRegion: Region = {
    latitude: 24.1426,
    longitude: -110.3126,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const cargarPuntos = async () => {
    try {
      const points = await getStudyPoints();
      setStudyPoints(points);
    } catch (error) {
      console.error('Error al cargar puntos:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      // await initStudyPointsTable();
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

  const handleMapPress = (event: MapPressEvent) => {
    if (selectedPoint) {
      setSelectedPoint(null);
      return;
    }
    const { coordinate } = event.nativeEvent;
    if (!coordinate) return;
    

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
    }, 500);
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
      }
    }
  };

  // 🔥 LÓGICA DE ACTUALIZACIÓN RESTAURADA
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
            }
          },
        },
      ]
    );
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
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <View style={styles.container}>
              
              {/* HEADER */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, font('rounded')]}>Puntos de Estudio</Text>
              </View>
              
              <Text style={[styles.headerSubtitle, { color: '#b5b5b5' }, font('sans')]}>
                Toca el mapa para agregar un lugar de estudio
              </Text>

              {/* MAPA */}
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={initialRegion}
                  showsUserLocation={true}
                  showsMyLocationButton={true}
                  showsCompass={false}
                  onPress={handleMapPress}
                >
                  {studyPoints.map((point) => (
                    <Marker
                      key={point.id}
                      coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                      title={point.name}
                      pinColor="#df96c0"
                      onPress={(e) => {
                        e.stopPropagation();
                        handleMarkerPress(point);
                      }}
                    />
                  ))}
                </MapView>

                {/* BRÚJULA */}
                <View style={styles.compassContainer} pointerEvents="box-none">
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
                    </View>
                  )}
                </View>
              </View>

              {/* 🔥 CARD DETALLE INFERIOR CON LOS BOTONES ORIGINALES RESTAURADOS */}
              {selectedPoint && (
                <View style={styles.selectedCard}>
                  <View style={styles.selectedHeader}>
                    <Text style={[styles.selectedName, font('rounded')]}>{selectedPoint.name}</Text>
                    <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                      <Text style={{ color: '#b5b5b5', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedPoint.notes && (
                    <Text style={[styles.selectedNotes, font('sans')]}>{selectedPoint.notes}</Text>
                  )}
                  
                  {/* Menú de Editar y Borrar */}
                  <View style={styles.selectedActions}>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => {
                        setEditingPoint(selectedPoint);
                        setEditModalVisible(true);
                        setSelectedPoint(null); // Cierra la tarjeta para limpiar el flujo
                      }}
                    >
                      <Text style={{ color: "#df96c0", fontWeight: '500' }}>✎ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteButton} 
                      onPress={handleDeletePoint}
                    >
                      <Text style={{ color: '#ff4444', fontWeight: '500' }}>X Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* MODAL PARA AGREGAR NUEVO PUNTO */}
              {modalVisible && (
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={modalVisible}
                  onRequestClose={() => setModalVisible(false)}
                >
                  <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                      <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' }}>Nuevo Punto de Estudio</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Nombre del lugar"
                        placeholderTextColor="#666"
                        value={newPointName}
                        onChangeText={setNewPointName}
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Notas (opcional)"
                        placeholderTextColor="#666"
                        value={newPointNotes}
                        onChangeText={setNewPointNotes}
                      />
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#ff4444' }]} onPress={() => setModalVisible(false)}>
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#df96c0' }]} onPress={handleSavePoint}>
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Guardar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

              {/* 🔥 MODAL PARA EDITAR PUNTO EXISTENTE (Restaurado e Inyectado con seguridad) */}
              {editModalVisible && editingPoint && (
                <Modal
                  animationType="fade"
                  transparent={true}
                  visible={editModalVisible}
                  onRequestClose={() => {
                    setEditModalVisible(false);
                    setEditingPoint(null);
                  }}
                >
                  <View style={styles.modalCenteredView}>
                    <View style={styles.modalView}>
                      <Text style={{ color: '#fff', fontSize: 18, marginBottom: 15, fontWeight: 'bold' }}>Editar Punto</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Nombre del lugar"
                        placeholderTextColor="#666"
                        value={editingPoint.name}
                        onChangeText={(text) => setEditingPoint({ ...editingPoint, name: text })}
                      />
                      <TextInput
                        style={styles.modalInput}
                        placeholder="Notas"
                        placeholderTextColor="#666"
                        value={editingPoint.notes || ''}
                        onChangeText={(text) => setEditingPoint({ ...editingPoint, notes: text })}
                      />
                      <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity 
                          style={[styles.modalButton, { backgroundColor: '#ff4444' }]} 
                          onPress={() => {
                            setEditModalVisible(false);
                            setEditingPoint(null);
                          }}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.modalButton, { backgroundColor: '#df96c0' }]} 
                          onPress={handleEditPoint}
                        >
                          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Actualizar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              )}

            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  fullScreenBackground: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  safeArea: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 20 },
  headerTitle: { fontSize: 27, fontWeight: '700', color: '#FFFFFF', textAlign: "center" },
  headerSubtitle: { fontSize: 15, marginBottom: 12, textAlign: 'center' },
  
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 15,
    position: 'relative',
  },
  map: { width: '100%', height: '100%' },

  compassContainer: { position: 'absolute', top: 20, right: 18, zIndex: 99 },
  compassWidget: { backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 50, padding: 10, borderWidth: 1, borderColor: '#df96c0' },
  compassWidgetInner: { alignItems: 'center' },
  compassWidgetNeedle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  compassWidgetArrow: { fontSize: 24 },
  compassWidgetDirection: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', marginTop: 4 },
  compassDetails: { position: 'absolute', top: 70, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 12, padding: 12, width: 140, borderWidth: 1, borderColor: '#df96c0' },
  compassDetailsTitle: { color: '#df96c0', fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  compassDetailsDirection: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  compassDetailsHeading: { color: '#b5b5b5', fontSize: 14, textAlign: 'center' },
  
  // Card inferior completa
  selectedCard: { position: 'absolute', bottom: 20, left: 16, right: 16, borderRadius: 16, padding: 16, backgroundColor: 'rgba(42, 47, 52, 0.95)', borderWidth: 1, borderColor: '#343a40', elevation: 5 },
  selectedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  selectedName: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  selectedNotes: { fontSize: 14, marginBottom: 12, color: '#b5b5b5' },
  selectedActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  editButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#343a40' },
  deleteButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' },

  // Modales
  modalCenteredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalView: { width: '85%', backgroundColor: '#1e222b', borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  modalInput: { width: '100%', backgroundColor: '#2a2f34', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 12 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
});

export default MapScreen;