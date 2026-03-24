// app/(tabs)/NewFlashcardSet.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, getFontFamily } from '../../constants/theme';
import { FlashcardSet, Flashcard, saveFlashcardSet, loadFlashcardSet } from '../../services/flashcardStorage';

const NewFlashcardSet = () => {
  const { setId } = useLocalSearchParams();
  const [setName, setSetName] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const frontInputRef = useRef<TextInput>(null);
  const backInputRef = useRef<TextInput>(null);

  const theme = Colors.dark;
  const router = useRouter();

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Cargar set existente si se está editando
  useEffect(() => {
    if (setId && setId !== 'undefined') {
      cargarSet();
    } else {
      setLoading(false);
    }
  }, [setId]);

  const cargarSet = async () => {
    setLoading(true);
    try {
      console.log('Cargando set con ID:', setId);
      const set = await loadFlashcardSet(setId as string);
      if (set) {
        console.log('Set cargado:', set.name, 'con', set.cards.length, 'tarjetas');
        setSetName(set.name);
        setCards(set.cards);
      } else {
        console.log('Set no encontrado');
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
    setFront('');
    setBack('');
    setEditingIndex(null);
    Keyboard.dismiss();
  };

  const addCard = () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Error', 'Completa ambos lados de la tarjeta');
      return;
    }

    if (editingIndex !== null) {
      // Editar tarjeta existente
      const newCards = [...cards];
      newCards[editingIndex] = {
        ...newCards[editingIndex],
        front: front.trim(),
        back: back.trim(),
      };
      setCards(newCards);
      Alert.alert('Éxito', 'Tarjeta actualizada');
      limpiarCampos();
    } else {
      // Agregar nueva tarjeta
      const newCard: Flashcard = {
        id: `card_${Date.now()}_${cards.length}`,
        front: front.trim(),
        back: back.trim(),
        mastered: false,
      };
      setCards([...cards, newCard]);
      Alert.alert('Éxito', 'Tarjeta agregada');
      limpiarCampos();
    }
  };

  const editCard = (index: number) => {
    setFront(cards[index].front);
    setBack(cards[index].back);
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

  const cancelEdit = () => {
    limpiarCampos();
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
                  Cargando set...
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
            
            <ScrollView 
              contentContainerStyle={styles.container}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }, font('rounded')]}>
                  {setId && setId !== 'undefined' ? '✏️ Editar Set' : '📚 Nuevo Set'}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Nombre del set */}
              <View style={styles.nameSection}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }, font('sans')]}>
                  NOMBRE DEL SET
                </Text>
                <TextInput
                  style={[styles.nameInput, { color: theme.text, borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.5)' }]}
                  placeholder="Ej: React Native Básico"
                  placeholderTextColor={theme.textMuted}
                  value={setName}
                  onChangeText={setSetName}
                />
              </View>

              {/* Lista de tarjetas existentes */}
              {cards.length > 0 && (
                <View style={styles.cardsList}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }, font('sans')]}>
                      TARJETAS ({cards.length})
                    </Text>
                    <Text style={[styles.sectionSubtitle, { color: theme.textMuted }, font('sans')]}>
                      {cards.filter(c => c.mastered).length} dominadas
                    </Text>
                  </View>
                  
                  {cards.map((card, index) => (
                    <View key={card.id} style={[styles.cardPreview, { borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.5)' }]}>
                      <View style={styles.cardPreviewNumber}>
                        <Text style={[styles.cardNumber, { color: theme.bearPrimary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.cardPreviewContent}>
                        <Text style={[styles.cardPreviewFront, { color: theme.text }, font('sans')]} numberOfLines={2}>
                          {card.front}
                        </Text>
                        <Text style={[styles.cardPreviewBack, { color: theme.textSecondary }, font('sans')]} numberOfLines={1}>
                          → {card.back}
                        </Text>
                      </View>
                      <View style={styles.cardPreviewActions}>
                        <TouchableOpacity onPress={() => editCard(index)} style={styles.actionBtn}>
                          <Text style={[styles.actionText, { color: theme.bearPrimary }]}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeCard(index)} style={styles.actionBtn}>
                          <Text style={[styles.actionText, { color: '#ff4444' }]}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Formulario para agregar/editar tarjeta */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }, font('sans')]}>
                  {editingIndex !== null ? '✏️ EDITANDO TARJETA' : '➕ AGREGAR NUEVA TARJETA'}
                </Text>
                
                <View style={[styles.formCard, { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: theme.border }]}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }, font('sans')]}>
                    FRENTE (Pregunta)
                  </Text>
                  <TextInput
                    ref={frontInputRef}
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.3)' }]}
                    placeholder="¿Qué es React Native?"
                    placeholderTextColor={theme.textMuted}
                    value={front}
                    onChangeText={setFront}
                    multiline
                  />
                  
                  <Text style={[styles.formLabel, { color: theme.textSecondary }, font('sans')]}>
                    DORSO (Respuesta)
                  </Text>
                  <TextInput
                    ref={backInputRef}
                    style={[styles.formInput, { color: theme.text, borderColor: theme.border, backgroundColor: 'rgba(0,0,0,0.3)' }]}
                    placeholder="Framework para construir apps móviles"
                    placeholderTextColor={theme.textMuted}
                    value={back}
                    onChangeText={setBack}
                    multiline
                  />
                  
                  <TouchableOpacity 
                    style={[styles.addCardButton, { backgroundColor: theme.bearPrimary }]} 
                    onPress={addCard}
                  >
                    <Text style={[styles.buttonText, { color: '#ffffff' }, font('rounded')]}>
                      {editingIndex !== null ? '✓ Actualizar tarjeta' : '+ Agregar tarjeta'}
                    </Text>
                  </TouchableOpacity>

                  {editingIndex !== null && (
                    <TouchableOpacity onPress={cancelEdit} style={styles.cancelEditButton}>
                      <Text style={[styles.cancelEditText, { color: theme.textSecondary }]}>
                        Cancelar edición
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Resumen del set */}
              <View style={styles.summarySection}>
                <Text style={[styles.summaryTitle, { color: theme.textSecondary }, font('sans')]}>
                  RESUMEN
                </Text>
                <View style={[styles.summaryCard, { backgroundColor: 'rgba(0,0,0,0.5)', borderColor: theme.border }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Nombre:</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }, font('sans')]}>
                      {setName || "Sin nombre"}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Tarjetas:</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }, font('sans')]}>
                      {cards.length}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Dominadas:</Text>
                    <Text style={[styles.summaryValue, { color: theme.bearPrimary }, font('rounded')]}>
                      {cards.filter(c => c.mastered).length}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Botón guardar */}
              <TouchableOpacity 
                style={[styles.saveButton, { backgroundColor: theme.bearPrimary }]} 
                onPress={saveSet}
                disabled={saving}
              >
                <Text style={[styles.saveButtonText, { color: '#ffffff' }, font('rounded')]}>
                  {saving ? 'Guardando...' : '💾 Guardar Set'}
                </Text>
              </TouchableOpacity>
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
  container: {
    padding: 20,
    paddingBottom: 40,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 20,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '600',
  },
  nameSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 18,
    fontWeight: '500',
  },
  cardsList: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  cardPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardPreviewNumber: {
    width: 32,
    alignItems: 'center',
  },
  cardNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardPreviewContent: {
    flex: 1,
    marginLeft: 8,
  },
  cardPreviewFront: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardPreviewBack: {
    fontSize: 12,
  },
  cardPreviewActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 8,
  },
  actionText: {
    fontSize: 18,
  },
  formSection: {
    marginBottom: 25,
  },
  formCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 8,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  addCardButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelEditButton: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelEditText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  summarySection: {
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default NewFlashcardSet;