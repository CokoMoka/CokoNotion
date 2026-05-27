import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImages } from "../constants/images";
import {
  Flashcard,
  FlashcardSet,
  loadFlashcardSet,
  saveFlashcardSet,
} from '../services/flashcardStorage';

// Función para convertir imagen a Base64
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 200, height: 200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    
    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error al convertir imagen:', error);
    throw error;
  }
};

export default function CreateSetScreen() {
  const { width } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;
  
  const { setId } = useLocalSearchParams();
  const router = useRouter();

  // Estados con la lógica completa
  const [setName, setSetName] = useState("");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [frontText, setFrontText] = useState("");
  const [backText, setBackText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!setId);
  const [saving, setSaving] = useState(false);
  const [setTitle, setSetTitle] = useState("Editar Set");
  
  // Estado para la portada
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);

  const frontInputRef = useRef<TextInput>(null);
  const backInputRef = useRef<TextInput>(null);

  // Cargar set existente si se está editando
  useEffect(() => {
    if (setId && setId !== 'undefined') {
      cargarSet();
    }
  }, [setId]);

  const cargarSet = async () => {
    setLoading(true);
    try {
      const set = await loadFlashcardSet(setId as string);
      if (set) {
        setSetName(set.name);
        setCards(set.cards);
        if (set.coverBase64) {
          setCoverImage(set.coverBase64);
        }
      } else {
        Alert.alert('Error', 'No se pudo encontrar el set');
      }
    } catch (error) {
      console.error('Error al cargar set:', error);
      Alert.alert('Error', 'No se pudo cargar el set');
    } finally {
      setLoading(false);
    }
  };

  const limpiarCampos = () => {
    setFrontText("");
    setBackText("");
    setEditingIndex(null);
    Keyboard.dismiss();
  };

  const addCard = () => {
    if (!frontText.trim() || !backText.trim()) {
      Alert.alert('Error', 'Completa ambos lados de la tarjeta');
      return;
    }

    if (editingIndex !== null) {
      const newCards = [...cards];
      newCards[editingIndex] = {
        ...newCards[editingIndex],
        front: frontText.trim(),
        back: backText.trim(),
      };
      setCards(newCards);
      Alert.alert('Éxito', 'Tarjeta actualizada');
      limpiarCampos();
    } else {
      const newCard: Flashcard = {
        id: `card_${Date.now()}_${cards.length}`,
        front: frontText.trim(),
        back: backText.trim(),
        mastered: false,
      };
      setCards([...cards, newCard]);
      Alert.alert('Éxito', 'Tarjeta agregada');
      limpiarCampos();
    }
  };

  const editCard = (index: number) => {
    setFrontText(cards[index].front);
    setBackText(cards[index].back);
    setEditingIndex(index);
    setTimeout(() => {
      frontInputRef.current?.focus();
    }, 100);
  };

  const removeCard = (index: number) => {
    Alert.alert(
      'Eliminar tarjeta',
      '¿Estás seguro de eliminar esta tarjeta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const newCards = cards.filter((_, i) => i !== index);
            setCards(newCards);
            if (editingIndex === index) {
              limpiarCampos();
            }
            Alert.alert('Éxito', 'Tarjeta eliminada');
          },
        },
      ]
    );
  };

  // Función para manejar la portada (un solo botón con acciones diferentes)
  const handleCoverAction = async () => {
    if (coverImage) {
      // Si ya hay portada, preguntar si quiere cambiarla o eliminarla
      Alert.alert(
        'Portada actual',
        '¿Qué deseas hacer con la portada?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Cambiar imagen', onPress: selectNewCover },
          { text: 'Eliminar portada', style: 'destructive', onPress: () => setCoverImage(null) }
        ]
      );
    } else {
      // Si no hay portada, seleccionar una nueva
      selectNewCover();
    }
  };

  const selectNewCover = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Se necesita acceso a la galería');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets[0]) {
        setUploadingCover(true);
        const imageUri = result.assets[0].uri;
        const base64Image = await imageToBase64(imageUri);
        setCoverImage(base64Image);
        Alert.alert('Portada seleccionada', 'La portada se guardará al guardar el set');
        setUploadingCover(false);
      }
    } catch (error) {
      console.error('Error al seleccionar imagen:', error);
      setUploadingCover(false);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const saveSet = async () => {
    if (!setName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el set');
      return;
    }
    if (cards.length === 0) {
      Alert.alert('Error', 'Agrega al menos una tarjeta');
      return;
    }

    setSaving(true);

    const newSet: FlashcardSet = {
      id: setId && setId !== 'undefined' ? String(setId) : Date.now().toString(),
      name: setName.trim(),
      cards,
      createdAt: new Date().toISOString(),
      coverBase64: coverImage || undefined,
    };

    const success = await saveFlashcardSet(newSet);
    setSaving(false);

    if (success) {
      Alert.alert('Éxito', 'Set guardado correctamente', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } else {
      Alert.alert('Error', 'No se pudo guardar el set');
    }
  };

  if (loading) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={AppImages.backgroundImg || require('../assets/images/bD.jpg')}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#df96c0" />
                <Text style={[styles.loadingText, { color: '#b5b5b5', marginTop: s(12) }]}>
                  Cargando set...
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ImageBackground
        source={AppImages.backgroundImg || require('../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.container, { paddingBottom: s(40) }]}>

                {/* BANNER con portada */}
                <View style={styles.bannerWrapper}>
                  <ImageBackground
                    source={coverImage ? { uri: coverImage } : AppImages.ejemplo || require('../assets/images/aD.jpg')}
                    resizeMode="cover"
                    style={[styles.banner, { height: s(120) }]}
                  />
                  <TouchableOpacity
                    style={[styles.editCoverButton, { 
                      paddingVertical: s(5),
                      borderRadius: s(32),
                      marginBottom: s(40),
                      marginTop: s(-40)
                    }]}
                    onPress={handleCoverAction}
                    disabled={uploadingCover}
                  >
                    <Text style={[styles.editCoverText]}>
                      {uploadingCover ? '⏳ Subiendo...' : coverImage ? '🖼️ Editar Portada' : '📷 Agregar Portada'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Título del Set */}
                <View style={[styles.setTitleContainer, { marginTop: s(-40), marginBottom: s(20) }]}>
                  <Text style={[styles.setTitle]}>
                    {setTitle}
                  </Text>
                </View>

                {/* NOMBRE DEL SET */}
                <Text style={[styles.sectionLabel, { 
                  marginBottom: s(12), 
                  marginLeft: s(24)
                }]}>
                  ¿Nombre del Set?
                </Text>

                <TextInput
                  style={[styles.nameInput, {
                    paddingVertical: s(16),
                    marginBottom: s(30),
                    marginHorizontal: s(24),
                    borderRadius: s(20),
                    paddingHorizontal: s(20)
                  }]}
                  placeholder="Ej: Vocabulario Inglés"
                  placeholderTextColor="#888888"
                  value={setName}
                  onChangeText={setSetName}
                />

                {/* Lista de tarjetas existentes */}
                {cards.length > 0 && (
                  <View style={[styles.cardsList, { marginHorizontal: s(20), marginBottom: s(16) }]}>
                    <Text style={[styles.cardLabel, { marginBottom: s(12), marginLeft: s(4) }]}>
                      Tarjetas ({cards.length}):
                    </Text>
                    {cards.map((card, index) => (
                      <View key={card.id} style={[styles.previewCard, { 
                        borderRadius: s(12), 
                        padding: s(12), 
                        marginBottom: s(8),
                        backgroundColor: '#2a2f34',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.previewText, { color: '#FFFFFF' }]}>
                            {index + 1}. ✦ {card.front.substring(0, 30)}
                            {card.front.length > 30 ? '...' : ''} → ➤ {card.back.substring(0, 30)}
                            {card.back.length > 30 ? '...' : ''}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: s(8) }}>
                          <TouchableOpacity onPress={() => editCard(index)}>
                            <Text style={{ color: '#df96c0', fontSize: s(18) }}>✎</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => removeCard(index)}>
                            <Text style={{ color: '#ff4444', fontSize: s(18) }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* SECCIÓN DE CARDS */}
                <View style={[styles.cardsSection, {
                  borderRadius: s(28),
                  paddingVertical: s(24),
                  marginBottom: s(24),
                  marginHorizontal: s(20)
                }]}>
                  <Text style={[styles.sectionTitle, { 
                    marginBottom: s(20), 
                    marginLeft: s(20)
                  }]}>
                    {editingIndex !== null ? '✏️ Editando Tarjeta' : '+ Nueva Card'}
                  </Text>

                  {/* INPUT FRENTE */}
                  <View style={{ marginHorizontal: s(20), marginBottom: s(16) }}>
                    <Text style={[styles.cardLabel, { marginBottom: s(8) }]}>
                      Frente:
                    </Text>
                    <TextInput
                      ref={frontInputRef}
                      style={[styles.textInput, { 
                        borderRadius: s(16), 
                        paddingVertical: s(12), 
                        paddingHorizontal: s(16),
                      }]}
                      placeholder="Escribe el frente de la tarjeta..."
                      placeholderTextColor="#888888"
                      value={frontText}
                      onChangeText={setFrontText}
                      multiline
                    />
                  </View>

                  {/* INPUT DORSO */}
                  <View style={{ marginHorizontal: s(20), marginBottom: s(20) }}>
                    <Text style={[styles.cardLabel, { marginBottom: s(8) }]}>
                      Dorso:
                    </Text>
                    <TextInput
                      ref={backInputRef}
                      style={[styles.textInput, { 
                        borderRadius: s(16), 
                        paddingVertical: s(12), 
                        paddingHorizontal: s(16),
                        minHeight: s(80)
                      }]}
                      placeholder="Escribe el dorso de la tarjeta..."
                      placeholderTextColor="#888888"
                      multiline
                      value={backText}
                      onChangeText={setBackText}
                    />
                  </View>

                  {/* BOTÓN AGREGAR/ACTUALIZAR CARD */}
                  <TouchableOpacity
                    style={[styles.addCardButton, {
                      borderRadius: s(20),
                      paddingVertical: s(14),
                      marginHorizontal: s(20),
                      backgroundColor: editingIndex !== null ? '#df96c0' : '#5e5e5e'
                    }]}
                    onPress={addCard}
                  >
                    <Text style={[styles.addCardText, { 
                      color: editingIndex !== null ? '#FFFFFF' : '#000000' 
                    }]}>
                      {editingIndex !== null ? '✓ Actualizar Tarjeta' : '+ Agregar Tarjeta'}
                    </Text>
                  </TouchableOpacity>

                  {editingIndex !== null && (
                    <TouchableOpacity onPress={limpiarCampos} style={{ alignItems: 'center', marginTop: s(12) }}>
                      <Text style={[styles.cancelEditText, { color: '#b5b5b5' }]}>
                        Cancelar edición
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* SECCIÓN DE RESUMEN */}
                <View style={[styles.summarySection, {
                  borderRadius: s(28),
                  paddingVertical: s(24),
                  marginHorizontal: s(20),
                  marginBottom: s(40)
                }]}>
                  <Text style={[styles.summaryTitle, { 
                    marginBottom: s(16), 
                    marginLeft: s(20)
                  }]}>
                    Resumen
                  </Text>

                  <View style={{ marginHorizontal: s(20), marginBottom: s(16) }}>
                    <Text style={[styles.summaryLabel, { marginBottom: s(8) }]}>
                      Nombre del Set:
                    </Text>
                    <View style={[styles.summaryValue, { borderRadius: s(12), padding: s(12), backgroundColor: '#2a2f34' }]}>
                      <Text style={[styles.summaryText, { color: '#FFFFFF' }]}>
                        {setName || "Sin nombre"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ marginHorizontal: s(20), marginBottom: s(16) }}>
                    <Text style={[styles.summaryLabel, { marginBottom: s(8) }]}>
                      Total de Tarjetas:
                    </Text>
                    <View style={[styles.summaryValue, { borderRadius: s(12), padding: s(12), backgroundColor: '#2a2f34' }]}>
                      <Text style={[styles.summaryText, { color: '#FFFFFF' }]}>
                        {cards.length} Tarjeta{cards.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* BOTÓN GUARDAR SET */}
                  <TouchableOpacity
                    style={[styles.saveButton, {
                      borderRadius: s(20),
                      paddingVertical: s(16),
                      marginHorizontal: s(20),
                      marginTop: s(8),
                    }]}
                    onPress={saveSet}
                    disabled={saving}
                  >
                    <Text style={[styles.saveButtonText]}>
                      {saving ? 'Guardando...' : '💾 Guardar Set'}
                    </Text>
                  </TouchableOpacity>
                </View>

              </View>
            </ScrollView>
          </SafeAreaView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
  },
  bannerWrapper: {
    width: '100%',
  },
  banner: {
    width: '100%',
  },
  setTitleContainer: {
    alignItems: 'center',
  },
  setTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontSize: 40,
    marginTop: 15,
  },
  sectionLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 24,
  },
  nameInput: {
    backgroundColor: '#2a2f34',
    borderWidth: 1,
    borderColor: '#343a40',
    color: '#FFFFFF',
    fontSize: 20,
  },
  cardsSection: {
    backgroundColor: 'rgb(28, 28, 28)',
    borderWidth: 1,
    borderColor: '#343a40',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  cardLabel: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
  textInput: {
    backgroundColor: '#2a2f34',
    borderWidth: 1,
    borderColor: '#343a40',
    color: '#FFFFFF',
    fontSize: 16,
  },
  addCardButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  cancelEditText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  cardsList: {
    marginBottom: 8,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: '#606060',
  },
  previewText: {
    fontWeight: '500',
    fontSize: 16,
  },
  summarySection: {
    backgroundColor: 'rgb(28, 28, 28)',
    borderWidth: 1,
    borderColor: '#343a40',
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 24,
  },
  summaryLabel: {
    color: '#b5b5b5',
    fontWeight: '600',
    fontSize: 16,
  },
  summaryValue: {
    borderWidth: 1,
    borderColor: '#343a40',
  },
  summaryText: {
    fontWeight: '600',
    fontSize: 18,
  },
  saveButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#c4c4c4',
  },
  saveButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#000000',
  },
  editCoverButton: {
    backgroundColor: 'rgba(43, 43, 43, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: 220,
    marginHorizontal: 'auto',
    marginTop: -63,
  },
  editCoverText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    justifyContent: 'center',
    alignItems: 'center',
  },
});