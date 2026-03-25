// app/(tabs)/FlashCards.tsx - Versión corregida
import React, { useState, useEffect, useCallback } from 'react';
import {
  FlatList,
  ImageBackground,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Colors, getFontFamily } from '../../constants/theme';
import { 
  FlashcardSet, 
  loadAllFlashcardSets, 
  deleteFlashcardSet,
  exportFlashcardSet,
} from '../../services/flashcardStorage';
import * as Sharing from 'expo-sharing';

const FlashcardsScreen = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = Colors.light;
  const router = useRouter();

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const cargarSets = async () => {
    setLoading(true);
    try {
      const loadedSets = await loadAllFlashcardSets();
      setSets(loadedSets);
    } catch (error) {
      console.error('Error al cargar sets:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarSets();
    }, [])
  );

  const totalCards = sets.reduce((acc, set) => acc + set.cards.length, 0);
  const totalMastered = sets.reduce((acc, set) => acc + set.cards.filter(c => c.mastered).length, 0);
  const porcentajeDominadas = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

 const handleStudy = (set: FlashcardSet) => {
  router.push({
    pathname: '/StudyScreen',
    params: { 
      setId: set.id, 
      setName: set.name,
      cards: JSON.stringify(set.cards)
    }
  });
};

  const handleEdit = (set: FlashcardSet) => {
    router.push({
      pathname: '/EditCardScreen',
      params: { setId: set.id, setName: set.name, cards: JSON.stringify(set.cards) }
    });
  };

  const handleDelete = (set: FlashcardSet) => {
    Alert.alert(
      'Eliminar set',
      `¿Estás seguro de eliminar "${set.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteFlashcardSet(set.id);
            cargarSets();
          },
        },
      ]
    );
  };

  const handleExport = async (set: FlashcardSet) => {
    const filePath = await exportFlashcardSet(set.id);
    if (filePath && await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath);
    } else {
      Alert.alert('Error', 'No se pudo exportar el set');
    }
  };

  const renderSet = ({ item }: { item: FlashcardSet }) => {
    const masteredCount = item.cards.filter(c => c.mastered).length;
    const progress = item.cards.length > 0 ? Math.round((masteredCount / item.cards.length) * 100) : 0;
    
    return (
      <TouchableOpacity 
        style={[styles.setCard, { 
          backgroundColor: theme.background,
          borderColor: theme.border,
        }]}
        onPress={() => handleStudy(item)}
      >
        <View style={[styles.setColorBar, { backgroundColor: progress === 100 ? '#4CAF50' : '#df96c0' }]} />
        <View style={styles.setInfo}>
          <Text style={[styles.setName, { color: theme.text }, font('rounded')]}>
            {item.name}
          </Text>
          <Text style={[styles.setCards, { color: theme.text }, font('sans')]}>
            {item.cards.length} tarjetas • {masteredCount} dominadas
          </Text>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${progress}%`, backgroundColor: progress === 100 ? '#4CAF50' : '#df96c0' }
              ]} 
            />
          </View>
        </View>
        <View style={styles.setActions}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleExport(item)} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: theme.textSecondary }]}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item)} style={styles.actionButton}>
            <Text style={[styles.actionText, { color: '#ff4444' }]}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

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
              contentContainerStyle={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.headerTitle, { color: '#ffffff' }, font('rounded')]}>
                    Mis Sets
                  </Text>
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: theme.bearAccent }]}
                    onPress={() => router.push('/NewFlashcardSet')}
                  >
                    <Text style={styles.addButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Estadísticas */}
                <View style={[styles.statsCard, { 
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                }]}>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.bearLight }, font('rounded')]}>
                        {totalCards}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.text }, font('sans')]}>
                        Tarjetas
                      </Text>
                    </View>
                    
                    <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.bearLight }, font('rounded')]}>
                        {sets.length}
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.text }, font('sans')]}>
                        Sets
                      </Text>
                    </View>
                    
                    <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                    
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: theme.bearSecondary }, font('rounded')]}>
                        {porcentajeDominadas}%
                      </Text>
                      <Text style={[styles.statLabel, { color: theme.text }, font('sans')]}>
                        Dominadas
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Lista de sets */}
                {loading ? (
                  <ActivityIndicator size="large" color={theme.bearPrimary} style={styles.loader} />
                ) : (
                  <FlatList
                    data={sets}
                    renderItem={renderSet}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.setsList}
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={false}
                    ListEmptyComponent={
                      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                        No hay sets de flashcards. Presiona + para crear uno.
                      </Text>
                    }
                  />
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </ImageBackground>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  // ... estilos existentes ...
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
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  addButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
  },
  statsCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
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
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 35,
  },
  setsList: {
    paddingBottom: 10,
  },
  setCard: {
    flexDirection: 'row',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
    alignItems: 'center',
  },
  setColorBar: {
    width: 8,
    height: '100%',
  },
  setInfo: {
    flex: 1,
    padding: 15,
  },
  setName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  setCards: {
    fontSize: 13,
    marginBottom: 10,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  setActions: {
    flexDirection: 'row',
    paddingRight: 15,
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  actionText: {
    fontSize: 18,
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default FlashcardsScreen;