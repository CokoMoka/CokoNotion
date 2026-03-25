// app/(tabs)/map.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { Colors, getFontFamily } from '../../constants/theme';
import { 
  StudyPoint, 
  getStudyPoints, 
  saveStudyPoint, 
  deleteStudyPoint, 
  updateStudyPoint,
  initStudyPointsTable 
} from '../../services/database';

const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [studyPoints, setStudyPoints] = useState<StudyPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<StudyPoint | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newPointName, setNewPointName] = useState('');
  const [newPointNotes, setNewPointNotes] = useState('');
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [editingPoint, setEditingPoint] = useState<StudyPoint | null>(null);
  
  const mapRef = useRef<MapView>(null);
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
    // Mover la cámara al punto seleccionado
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
          source={require('../../assets/images/bD.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.bearPrimary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Cargando mapa...
                </Text>
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
        source={require('../../assets/images/bD.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" />
            
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: '#ffffff' }, font('rounded')]}>
                  📍 Puntos de Estudio
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }, font('sans')]}>
                  Toca el mapa para agregar un lugar
                </Text>
              </View>

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
                <View style={[styles.selectedCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <View style={styles.selectedHeader}>
                    <Text style={[styles.selectedName, { color: theme.text }, font('rounded')]}>
                      {selectedPoint.name}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedPoint(null)}>
                      <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  {selectedPoint.notes && (
                    <Text style={[styles.selectedNotes, { color: theme.textSecondary }, font('sans')]}>
                      {selectedPoint.notes}
                    </Text>
                  )}
                  <View style={styles.selectedActions}>
                    <TouchableOpacity 
                      style={[styles.editButton, { borderColor: theme.border }]}
                      onPress={() => {
                        setEditingPoint(selectedPoint);
                        setEditModalVisible(true);
                        setSelectedPoint(null);
                      }}
                    >
                      <Text style={[styles.editButtonText, { color: theme.bearPrimary }]}>✎ Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.deleteButton, { borderColor: '#ff4444' }]}
                      onPress={handleDeletePoint}
                    >
                      <Text style={[styles.deleteButtonText, { color: '#ff4444' }]}>🗑️ Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Modal para agregar punto */}
              <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }, font('rounded')]}>
                      📍 Nuevo punto de estudio
                    </Text>
                    
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
                      Nombre del lugar
                    </Text>
                    <TextInput
                      style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Ej: Biblioteca Central"
                      placeholderTextColor={theme.textMuted}
                      value={newPointName}
                      onChangeText={setNewPointName}
                    />
                    
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
                      Notas (opcional)
                    </Text>
                    <TextInput
                      style={[styles.modalTextArea, { color: theme.text, borderColor: theme.border }]}
                      placeholder="Horario, recomendaciones, etc."
                      placeholderTextColor={theme.textMuted}
                      value={newPointNotes}
                      onChangeText={setNewPointNotes}
                      multiline
                      numberOfLines={3}
                    />
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.modalCancel, { borderColor: theme.border }]}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalSave, { backgroundColor: theme.bearPrimary }]}
                        onPress={handleSavePoint}
                      >
                        <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                          Guardar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>

              {/* Modal para editar punto */}
              <Modal
                visible={editModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={[styles.modalContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                    <Text style={[styles.modalTitle, { color: theme.text }, font('rounded')]}>
                      ✏️ Editar punto de estudio
                    </Text>
                    
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
                      Nombre del lugar
                    </Text>
                    <TextInput
                      style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
                      value={editingPoint?.name || ''}
                      onChangeText={(text) => setEditingPoint(prev => prev ? { ...prev, name: text } : null)}
                      placeholderTextColor={theme.textMuted}
                    />
                    
                    <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
                      Notas
                    </Text>
                    <TextInput
                      style={[styles.modalTextArea, { color: theme.text, borderColor: theme.border }]}
                      value={editingPoint?.notes || ''}
                      onChangeText={(text) => setEditingPoint(prev => prev ? { ...prev, notes: text } : null)}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor={theme.textMuted}
                    />
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity 
                        style={[styles.modalCancel, { borderColor: theme.border }]}
                        onPress={() => setEditModalVisible(false)}
                      >
                        <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.modalSave, { backgroundColor: theme.bearPrimary }]}
                        onPress={handleEditPoint}
                      >
                        <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                          Actualizar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
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
  },
  header: {
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 30,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 4,
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
    left: 20,
    right: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalTextArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default MapScreen;