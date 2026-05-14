// app/(tabs)/StudyScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, getFontFamily } from '../constants/theme';
import { updateCardProgress, loadFlashcardSet } from '../services/flashcardStorage';
import { AppImages } from '../constants/images';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

const StudyScreen = () => {
  const { width, height } = useWindowDimensions();
  const s = (value: number) => value * (width / 390);
  const v = (value: number) => value * (height / 844);
  
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const messageTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  
  const [setId, setSetId] = useState<string>('');
  const [setName, setSetName] = useState<string>('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);
  const [localMasteredCount, setLocalMasteredCount] = useState(0);

  const theme = Colors.light;
  
  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Actualizar contador de dominadas local
  useEffect(() => {
    const mastered = cards.filter(c => c.mastered).length;
    setLocalMasteredCount(mastered);
  }, [cards]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (params.setId && params.setName && params.cards) {
        try {
          const parsedCards = JSON.parse(params.cards as string);
          const newSetId = params.setId as string;
          const newSetName = params.setName as string;
          
          setSetId(newSetId);
          setSetName(newSetName);
          setCards(parsedCards);
          setCurrentIndex(0);
          setShowAnswer(false);
          setShowCompleteMessage(false);
        } catch (error) {
          console.error('Error al parsear parámetros:', error);
          Alert.alert('Error', 'No se pudieron cargar las tarjetas');
          router.back();
        }
      } else {
        Alert.alert('Error', 'Faltan parámetros para estudiar');
        router.back();
      }
      
      setLoading(false);
    };
    
    loadData();
  }, [params.setId]);

  const animateCard = () => {
    Animated.sequence([
      Animated.spring(cardScale, { toValue: 0.98, useNativeDriver: true, tension: 50, friction: 3 }),
      Animated.spring(cardScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 3 }),
    ]).start();
  };

  const mostrarMensajeCompletado = useCallback(() => {
    if (messageTimeout.current) {
      clearTimeout(messageTimeout.current);
    }
    
    setShowCompleteMessage(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    messageTimeout.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowCompleteMessage(false);
      });
    }, 2000);
  }, [fadeAnim]);

  const currentCard = cards[currentIndex];
  const remainingCards = cards.length - (currentIndex + 1);
  const progress = ((currentIndex + 1) / cards.length) * 100;

  const recargarSetActualizado = useCallback(async () => {
    if (!setId) return;
    try {
      const setActualizado = await loadFlashcardSet(setId);
      if (setActualizado) {
        setCards(setActualizado.cards);
      }
    } catch (error) {
      console.error('Error al recargar set:', error);
    }
  }, [setId]);

  const handleKnow = useCallback(async () => {
    if (saving || !currentCard) return;
    
    setSaving(true);
    animateCard();
    
    try {
      await updateCardProgress(setId, currentCard.id, true);
      
      const newCards = [...cards];
      newCards[currentIndex] = {
        ...newCards[currentIndex],
        mastered: true,
      };
      setCards(newCards);
      
      const isLastCard = currentIndex + 1 >= cards.length;
      
      if (!isLastCard) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        const nuevasDominadas = cards.filter(c => c.mastered).length + 1;
        const totalCards = cards.length;
        
        mostrarMensajeCompletado();
        
        setTimeout(() => {
          Alert.alert(
            '🎉 ¡Felicidades!',
            `Has completado el set "${setName}".\n\nDominadas: ${nuevasDominadas}/${totalCards}`,
            [
              { 
                text: 'Estudiar de nuevo', 
                onPress: () => {
                  recargarSetActualizado().then(() => {
                    setCurrentIndex(0);
                    setShowAnswer(false);
                  });
                }
              },
              { 
                text: 'Volver', 
                onPress: () => router.back() 
              }
            ]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      Alert.alert('Error', 'No se pudo guardar el progreso');
    } finally {
      setSaving(false);
    }
  }, [saving, currentCard, cards, currentIndex, setId, setName, router, mostrarMensajeCompletado, recargarSetActualizado, animateCard]);

  const handleDontKnow = useCallback(async () => {
    if (saving || !currentCard) return;
    
    setSaving(true);
    animateCard();
    
    try {
      await updateCardProgress(setId, currentCard.id, false);
      
      const newCards = [...cards];
      newCards[currentIndex] = {
        ...newCards[currentIndex],
        mastered: false,
      };
      setCards(newCards);
      
      const isLastCard = currentIndex + 1 >= cards.length;
      
      if (!isLastCard) {
        setCurrentIndex(currentIndex + 1);
        setShowAnswer(false);
      } else {
        const masteredCountNow = cards.filter(c => c.mastered).length;
        const totalCards = cards.length;
        
        mostrarMensajeCompletado();
        
        setTimeout(() => {
          Alert.alert(
            '📚 Sesión completada',
            `Has repasado todas las tarjetas del set "${setName}".\n\nDominadas: ${masteredCountNow}/${totalCards}`,
            [
              { 
                text: 'Repasar de nuevo', 
                onPress: () => {
                  recargarSetActualizado().then(() => {
                    setCurrentIndex(0);
                    setShowAnswer(false);
                  });
                }
              },
              { 
                text: 'Volver', 
                onPress: () => router.back() 
              }
            ]
          );
        }, 500);
      }
    } catch (error) {
      console.error('Error al guardar progreso:', error);
      Alert.alert('Error', 'No se pudo guardar el progreso');
    } finally {
      setSaving(false);
    }
  }, [saving, currentCard, cards, currentIndex, setId, setName, router, mostrarMensajeCompletado, recargarSetActualizado, animateCard]);

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
                <Text style={styles.loadingText}>Cargando tarjetas...</Text>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </View>
    );
  }

  if (!currentCard) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={AppImages.backgroundImg || require('../assets/images/bD.jpg')}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>No hay tarjetas para estudiar</Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
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
            
            {showCompleteMessage && (
              <Animated.View style={[styles.completeMessage, { opacity: fadeAnim }]}>
                <Text style={styles.completeMessageText}>
                  ¡Has completado todas las tarjetas!
                </Text>
              </Animated.View>
            )}
            
            <View style={[styles.container, { paddingHorizontal: s(20), paddingVertical: v(20) }]}>
              
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.setName, font('rounded')]} numberOfLines={1}>
                  {setName}
                </Text>
                <View style={styles.placeholder} />
              </View>

              {/* Barra de progreso */}
              <View style={styles.progressSection}>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: '#df96c0' }]} />
                </View>
                <Text style={styles.progressText}>
                  Tarjeta {currentIndex + 1} de {cards.length}
                </Text>
              </View>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#df96c0' }]}>{localMasteredCount}</Text>
                  <Text style={styles.statLabel}>Dominadas</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: '#b5b5b5' }]}>{remainingCards}</Text>
                  <Text style={styles.statLabel}>Restantes</Text>
                </View>
              </View>

              {/* Tarjeta */}
              <Animated.View style={[styles.cardContainer, { transform: [{ scale: cardScale }] }]}>
                <View style={[styles.card, { backgroundColor: '#2a2f34', borderColor: '#343a40' }]}>
                  <Text style={[styles.cardText, { color: '#FFFFFF' }, font('rounded')]}>
                    {showAnswer ? currentCard.back : currentCard.front}
                  </Text>
                </View>
              </Animated.View>

              {/* Botones */}
              {!showAnswer ? (
                <TouchableOpacity
                  style={[styles.showAnswerButton, { backgroundColor: '#df96c0' }]}
                  onPress={() => setShowAnswer(true)}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }, font('rounded')]}>
                    Mostrar respuesta
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.dontKnowButton, { borderColor: '#ff4444' }]}
                    onPress={handleDontKnow}
                    disabled={saving}
                  >
                    <Text style={[styles.buttonText, { color: '#ff4444' }, font('rounded')]}>
                      {saving ? 'Guardando...' : 'No lo sabía'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.knowButton, { backgroundColor: '#4CAF50' }]}
                    onPress={handleKnow}
                    disabled={saving}
                  >
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }, font('rounded')]}>
                      {saving ? 'Guardando...' : 'Lo sabía ✓'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </View>
  );
};

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
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#df96c0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  setName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#343a40',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#b5b5b5',
    textAlign: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 12,
    backgroundColor: '#2a2f34',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#343a40',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#b5b5b5',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#343a40',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    minHeight: 300,
    borderRadius: 24,
    padding: 30,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardText: {
    fontSize: 24,
    textAlign: 'center',
    lineHeight: 32,
  },
  showAnswerButton: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 20,
  },
  knowButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  dontKnowButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  completeMessage: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  completeMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default StudyScreen;