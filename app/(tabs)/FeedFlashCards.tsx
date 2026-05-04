// app/(tabs)/FlashCards.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Image,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { 
  FlashcardSet, 
  loadAllFlashcardSets, 
  deleteFlashcardSet,
  exportFlashcardSet,
} from '../../services/flashcardStorage';
import * as Sharing from 'expo-sharing';

const { width, height } = Dimensions.get("window");

const FlashcardsScreen = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  // Estadísticas dinámicas
  const totalCards = sets.reduce((acc, set) => acc + set.cards.length, 0);
  const totalMastered = sets.reduce((acc, set) => acc + set.cards.filter(c => c.mastered).length, 0);
  const porcentajeDominadas = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  const stats = [
    { value: `${totalMastered}`, label: "Dominadas" },
    { value: `${totalCards}`, label: "Tarjetas" },
    { value: `${sets.length}`, label: "Sets" },
  ];

  // Funciones
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
      pathname: '/EditSet',
      params: { setId: set.id }
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

  const handleCreateNew = () => {
    router.push('/NewSet');
  };

  // Imagen por defecto si no hay imagen personalizada
  const getSetImage = (set: FlashcardSet) => {
    // Aquí puedes personalizar según el set.id o set.name
    // Por ahora usamos imágenes predeterminadas basadas en el índice
    const images = [
      require("../../assets/images/cutean.jpg"),
      require("../../assets/images/disk.jpg"),
      require("../../assets/images/cutean.jpg"),
      require("../../assets/images/disk.jpg"),
    ];
    return images[Math.abs(set.id?.length || 0) % images.length];
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          
          {/* Header con título */}
          <View style={styles.header}>
            <Image
              source={require("../../assets/images/icon.jpg")}
              resizeMode="contain"
              style={styles.headerImage}
            />
            <Text style={styles.headerTitle}>FlashCards</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleCreateNew}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Grid de flashcards - 2 columnas */}
          {loading ? (
            <ActivityIndicator size="large" color="#df96c0" style={styles.loader} />
          ) : sets.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay sets de flashcards</Text>
              <Text style={styles.emptySubtext}>Presiona + para crear uno</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {sets.map((item, index) => {
                const masteredCount = item.cards.filter(c => c.mastered).length;
                const progress = item.cards.length > 0 ? Math.round((masteredCount / item.cards.length) * 100) : 0;
                
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.cardContainer}
                    onPress={() => handleStudy(item)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={getSetImage(item)}
                      resizeMode="cover"
                      style={styles.cardImage}
                    />
                    {/* Barra de progreso */}
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${progress}%`, backgroundColor: progress === 100 ? '#4CAF50' : '#df96c0' }
                        ]} 
                      />
                    </View>
                    <View style={styles.cardFooter}>
                      <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <View style={styles.actionButtons}>
                          {/* Botón Editar */}
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEdit(item)}
                          >
                            <Text style={styles.actionButtonText}>✎</Text>
                          </TouchableOpacity>
                          
                          {/* Botón Eliminar */}
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDelete(item)}
                          >
                            <Text style={styles.actionButtonText}>✗</Text>
                          </TouchableOpacity>
                          
                          {/* Botón Exportar */}
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleExport(item)}
                          >
                            <Text style={styles.actionButtonText}>➜</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                      <View style={styles.cardStats}>
                        <Text style={styles.cardStatsText}>
                          {item.cards.length} tarjetas • {masteredCount} dominadas
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Stats footer */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statItem}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1C1C1C",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.02,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    marginTop: height * 0.05,
  },
  headerImage: {
    width: width * 0.12,
    height: width * 0.12,
    marginRight: width * 0.02,
    borderRadius: width * 0.06,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: width * 0.08,
    fontWeight: "bold",
    flex: 1,
  },
  addButton: {
    paddingHorizontal: width * 0.03,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.08,
    fontWeight: "bold",
  },
  // Loader y empty states
  loader: {
    marginTop: height * 0.1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.1,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: width * 0.05,
    fontWeight: 'bold',
    marginBottom: height * 0.01,
  },
  emptySubtext: {
    color: '#8E8E8E',
    fontSize: width * 0.035,
  },
  // Grid
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: width * 0.04,
  },
  cardContainer: {
    width: (width * 0.92) / 2 - width * 0.02,
    marginBottom: height * 0.02,
    borderRadius: width * 0.03,
    overflow: "hidden",
    padding: width * 0.01,
    backgroundColor: "#2a2f34",
  },
  cardImage: {
    width: "100%",
    height: width * 0.37,
    backgroundColor: "#000000",
    borderRadius: width * 0.02,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#343a40',
    marginTop: 6,
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  cardFooter: {
    padding: width * 0.02,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: width * 0.035,
    fontWeight: "bold",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: width * 0.008,
  },
  actionButton: {
    paddingHorizontal: width * 0.005,
    paddingVertical: height * 0.003,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: width * 0.035,
  },
  cardStats: {
    marginTop: height * 0.005,
  },
  cardStatsText: {
    color: "#8E8E8E",
    fontSize: width * 0.025,
  },
  // Stats footer
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: height * 0.02,
    marginTop: height * 0.01,
    borderTopWidth: 1,
    borderTopColor: "#3D3D3D",
    marginHorizontal: width * 0.04,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: width * 0.08,
    fontWeight: "bold",
    marginBottom: height * 0.003,
  },
  statLabel: {
    color: "#8E8E8E",
    fontSize: width * 0.025,
    fontWeight: "bold",
  },
});

export default FlashcardsScreen;