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
import { Colors, getFontFamily } from '../constants/theme';
import { FlashcardSet, Flashcard, saveFlashcardSet, loadFlashcardSet } from '../services/flashcardStorage';

const NewFlashcardSet = () => {
  const { setId } = useLocalSearchParams();
  const [setName, setSetName] = useState('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(!!setId);
  const [saving, setSaving] = useState(false);
  
  const frontInputRef = useRef<TextInput>(null);
  const backInputRef = useRef<TextInput>(null);

  const theme = Colors.light;
  const router = useRouter();

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Cargar set existente si se está editando
  useEffect(() => {
    if (setId) {
      cargarSet();
    } else {
      setLoading(false);
    }
  }, [setId]);

  const cargarSet = async () => {
    try {
      const set = await loadFlashcardSet(setId as string);
      if (set) {
        setSetName(set.name);
        setCards(set.cards);
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
      id: setId ? String(setId) : Date.now().toString(),
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
          source={require('../assets/images/bD.jpg')}
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
        source={require('../assets/images/bD.jpg')}
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
                  {setId ? 'Editar Set' : 'Nuevo Set'}
                </Text>
                <View style={{ width: 40 }} />
              </View>

              {/* Nombre del set */}
              <View style={styles.nameContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }, font('sans')]}>
                  NOMBRE DEL SET
                </Text>
                <TextInput
                  style={[styles.nameInput, { 
                    color: theme.text, 
                    borderColor: theme.border,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)'
                  }]}
                  placeholder="Ej: React Native Básico"
                  placeholderTextColor={theme.textMuted}
                  value={setName}
                  onChangeText={setSetName}
                />
              </View>

              {/* Lista de tarjetas existentes */}
              {cards.length > 0 && (
                <View style={styles.cardsSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }, font('sans')]}>
                      TARJETAS
                    </Text>
                    <Text style={[styles.cardCount, { color: theme.bearPrimary }, font('rounded')]}>
                      {cards.length}
                    </Text>
                  </View>
                  
                  {cards.map((card, index) => (
                    <View key={card.id} style={[styles.cardItem, { 
                      borderColor: theme.border,
                      backgroundColor: 'rgba(0, 0, 0, 0.6)'
                    }]}>
                      <View style={styles.cardNumber}>
                        <Text style={[styles.cardNumberText, { color: theme.bearPrimary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.cardContent}>
                        <Text style={[styles.cardFront, { color: theme.text }, font('sans')]}>
                          {card.front}
                        </Text>
                        <Text style={[styles.cardBack, { color: theme.textSecondary }, font('sans')]}>
                          {card.back}
                        </Text>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity onPress={() => editCard(index)} style={styles.actionBtn}>
                          <Text style={[styles.actionText, { color: theme.bearPrimary }]}>✎</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => removeCard(index)} style={styles.actionBtn}>
                          <Text style={[styles.actionText, { color: '#ff6b6b' }]}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Formulario para agregar/editar tarjeta */}
              <View style={styles.formSection}>
                <Text style={[styles.formTitle, { color: theme.textSecondary }, font('sans')]}>
                  {editingIndex !== null ? '✏️ EDITANDO TARJETA' : '➕ NUEVA TARJETA'}
                </Text>
                
                <View style={[styles.formCard, { 
                  borderColor: theme.border,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }]}>
                  <Text style={[styles.formLabel, { color: theme.textSecondary }, font('sans')]}>
                    FRENTE (Pregunta)
                  </Text>
                  <TextInput
                    ref={frontInputRef}
                    style={[styles.formInput, { 
                      color: theme.text, 
                      borderColor: theme.border,
                      backgroundColor: 'rgba(0, 0, 0, 0.4)'
                    }]}
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
                    style={[styles.formInput, { 
                      color: theme.text, 
                      borderColor: theme.border,
                      backgroundColor: 'rgba(0, 0, 0, 0.4)'
                    }]}
                    placeholder="Framework para construir apps móviles"
                    placeholderTextColor={theme.textMuted}
                    value={back}
                    onChangeText={setBack}
                    multiline
                  />
                  
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: theme.bearPrimary }]} 
                    onPress={addCard}
                  >
                    <Text style={[styles.addButtonText, { color: '#ffffff' }, font('rounded')]}>
                      {editingIndex !== null ? '✓ Actualizar tarjeta' : '+ Agregar tarjeta'}
                    </Text>
                  </TouchableOpacity>

                  {editingIndex !== null && (
                    <TouchableOpacity onPress={cancelEdit} style={styles.cancelEditBtn}>
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
                <View style={[styles.summaryCard, { 
                  borderColor: theme.border,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Nombre del set</Text>
                    <Text style={[styles.summaryValue, { color: theme.text }, font('sans')]}>
                      {setName || "Sin nombre"}
                    </Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total de tarjetas</Text>
                    <Text style={[styles.summaryValue, { color: theme.bearPrimary }, font('rounded')]}>
                      {cards.length}
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
    marginBottom: 30,
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
  nameContainer: {
    marginBottom: 24,
  },
  label: {
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
  cardsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  cardNumber: {
    width: 32,
    alignItems: 'center',
  },
  cardNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    marginLeft: 8,
  },
  cardFront: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  cardBack: {
    fontSize: 12,
  },
  cardActions: {
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
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
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
  addButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelEditBtn: {
    alignItems: 'center',
    marginTop: 12,
  },
  cancelEditText: {
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  summarySection: {
    marginBottom: 24,
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
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  saveButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default NewFlashcardSet;