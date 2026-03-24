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
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, getFontFamily } from '../../constants/theme';
import { updateCardProgress } from '../../services/flashcardStorage';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

const StudyScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  
  const messageTimeout = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // ✅ Usar el setId como parte del estado para forzar recargas
  const [setId, setSetId] = useState<string>('');
  const [setName, setSetName] = useState<string>('');
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCompleteMessage, setShowCompleteMessage] = useState(false);

  const theme = Colors.dark;
  
  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // ✅ Solo cargar cuando el componente se monta o cuando cambia el setId
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
  }, [params.setId]); // ✅ Solo depende de setId, no de todo params

  // ✅ Función para mostrar mensaje de completado
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
  const masteredCount = cards.filter(c => c.mastered).length;

  const handleKnow = useCallback(async () => {
    if (saving || !currentCard) return;
    
    setSaving(true);
    
    const newCards = [...cards];
    newCards[currentIndex] = {
      ...newCards[currentIndex],
      mastered: true,
    };
    setCards(newCards);
    
    await updateCardProgress(setId, currentCard.id, true);
    setSaving(false);
    
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      mostrarMensajeCompletado();
      
      setTimeout(() => {
        Alert.alert(
          '🎉 ¡Felicidades!',
          `Has completado el set "${setName}".\n\nDominadas: ${masteredCount + 1}/${cards.length}`,
          [
            { 
              text: 'Estudiar de nuevo', 
              onPress: () => {
                setCurrentIndex(0);
                setShowAnswer(false);
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
  }, [saving, currentCard, cards, currentIndex, setId, setName, masteredCount, router, mostrarMensajeCompletado]);

  const handleDontKnow = useCallback(async () => {
    if (saving || !currentCard) return;
    
    setSaving(true);
    
    const newCards = [...cards];
    newCards[currentIndex] = {
      ...newCards[currentIndex],
      mastered: false,
    };
    setCards(newCards);
    
    await updateCardProgress(setId, currentCard.id, false);
    setSaving(false);
    
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      mostrarMensajeCompletado();
      
      setTimeout(() => {
        Alert.alert(
          '📚 Sesión completada',
          `Has repasado todas las tarjetas del set "${setName}".\n\nDominadas: ${cards.filter(c => c.mastered).length}/${cards.length}`,
          [
            { 
              text: 'Repasar de nuevo', 
              onPress: () => {
                setCurrentIndex(0);
                setShowAnswer(false);
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
  }, [saving, currentCard, cards, currentIndex, setId, setName, router, mostrarMensajeCompletado]);

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
                  Cargando tarjetas...
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </SafeAreaProvider>
    );
  }

  if (!currentCard) {
    return (
      <SafeAreaProvider>
        <ImageBackground
          source={require('../../assets/images/bD.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                  No hay tarjetas para estudiar
                </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={[styles.backButtonText, { color: theme.bearPrimary }]}>
                    ← Volver
                  </Text>
                </TouchableOpacity>
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
            
            {showCompleteMessage && (
              <Animated.View style={[styles.completeMessage, { opacity: fadeAnim }]}>
                <Text style={[styles.completeMessageText, { color: '#ffffff' }, font('rounded')]}>
                  🎉 ¡Has completado todas las tarjetas! 🎉
                </Text>
              </Animated.View>
            )}
            
            <View style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={[styles.backIcon, { color: theme.text }]}>←</Text>
                </TouchableOpacity>
                <Text style={[styles.setName, { color: theme.text }, font('rounded')]} numberOfLines={1}>
                  {setName}
                </Text>
                <Text style={[styles.progress, { color: theme.textSecondary }, font('sans')]}>
                  {currentIndex + 1}/{cards.length}
                </Text>
              </View>

              <View style={styles.statsHeader}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.bearPrimary }, font('rounded')]}>
                    {masteredCount}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                    Dominadas
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: theme.textSecondary }, font('rounded')]}>
                    {remainingCards}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.textMuted }, font('sans')]}>
                    Restantes
                  </Text>
                </View>
              </View>

              <View style={styles.cardContainer}>
                <View style={[styles.card, { backgroundColor: theme.background, borderColor: theme.border }]}>
                  <Text style={[styles.cardText, { color: theme.text }, font('rounded')]}>
                    {showAnswer ? currentCard.back : currentCard.front}
                  </Text>
                </View>
              </View>

              {!showAnswer ? (
                <TouchableOpacity
                  style={[styles.showAnswerButton, { backgroundColor: theme.bearPrimary }]}
                  onPress={() => setShowAnswer(true)}
                >
                  <Text style={[styles.buttonText, { color: '#ffffff' }, font('rounded')]}>
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
                    <Text style={[styles.buttonText, { color: '#ffffff' }, font('rounded')]}>
                      {saving ? 'Guardando...' : 'Lo sabía ✓'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
    padding: 20,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  backIcon: {
    fontSize: 28,
    fontWeight: '300',
  },
  setName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  progress: {
    fontSize: 14,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
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
  },
});

export default StudyScreen;