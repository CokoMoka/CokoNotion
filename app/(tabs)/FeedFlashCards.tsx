// app/(tabs)/FlashCards.tsx
import React, { useState, useCallback, useEffect } from "react";
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
  ImageBackground,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { 
  FlashcardSet, 
  loadAllFlashcardSets, 
  deleteFlashcardSet,
  exportFlashcardSet,
} from '../../services/flashcardStorage';
import * as Sharing from 'expo-sharing';
import { getUserAvatar, getUserBanner, getUserBackground } from "../../services/avatarService";
import { useUser } from "../../hooks/useUser";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImages } from "@/constants/images";

const { width, height } = Dimensions.get("window");

const FlashcardsScreen = () => {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 🔥 NUEVO: estado para refresh
  const router = useRouter();

  // Estados para imágenes del usuario
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(true);

  const { user, loading: userLoading } = useUser();

  // 🔥 NUEVO: Función para cargar sets (puede ser llamada con refresh)
  const cargarSets = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const loadedSets = await loadAllFlashcardSets();
      setSets(loadedSets);
    } catch (error) {
      console.error('Error al cargar sets:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

    const cargarImagenesUsuario = useCallback(async () => {
      if (!user?.uid) return;
      
      try {
        const [avatar, banner, background] = await Promise.all([
          getUserAvatar(user.uid),
          getUserBanner(user.uid),
          getUserBackground(user.uid),
        ]);
        
        setAvatarUrl(avatar);
        setBannerUrl(banner);
        setBackgroundUrl(background);
      } catch (error) {
        console.error('Error al cargar imágenes:', error);
      }
    }, [user?.uid]);

  // 🔥 NUEVO: Función para refrescar (pull-to-refresh)
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarSets(false);
    await Promise.all([cargarImagenesUsuario()]);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarSets();
    }, [])
  );

  // Cargar imágenes del usuario
  useEffect(() => {
    if (user?.uid) {
      cargarImagenes();
      cargarImagenesUsuario();
    }
  }, [user]);

  const cargarImagenes = async () => {
    if (!user?.uid) return;
    setLoadingImages(true);
    
    try {
      const [avatar, banner, background] = await Promise.all([
        getUserAvatar(user.uid),
        getUserBanner(user.uid),
        getUserBackground(user.uid),
      ]);
      
      setAvatarUrl(avatar);
      setBannerUrl(banner);
      setBackgroundUrl(background);
    } catch (error) {
      console.error('Error al cargar imágenes:', error);
    } finally {
      setLoadingImages(false);
    }
  };

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
            cargarSets(); // Recargar después de eliminar
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

  const getSetImage = (set: FlashcardSet) => {
    if (set.coverBase64) {
      return { uri: set.coverBase64 };
    }
    const images = [
      require("../../assets/images/Carpeta.png"),
      require("../../assets/images/Carpeta.png"),
    ];
    return images[Math.abs(set.id?.length || 0) % images.length];
  };

  if (userLoading || loadingImages) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#df96c0" />
              <Text style={styles.loadingText}>Cargando...</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" />
      
      <ImageBackground 
        source={backgroundUrl ? { uri: backgroundUrl } : AppImages.backgroundImg }
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              // 🔥 NUEVO: RefreshControl para pull-to-refresh
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#df96c0']}
                  tintColor="#df96c0"
                  title="Actualizando..."
                  titleColor="#ffffff"
                  progressBackgroundColor="rgba(0,0,0,0.3)"
                />
              }
            >
              <View style={styles.content}>
                
                {/* Header con avatar y título */}
                <View style={styles.header}>
                  {avatarUrl ? (
                    <Image
                      source={{ uri: avatarUrl }}
                      resizeMode="cover"
                      style={styles.headerImage}
                    />
                  ) : (
                    <Image
                      source={AppImages.icon}
                      resizeMode="contain"
                      style={styles.headerImage}
                    />
                  )}
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
                          {/* Barra de progreso (opcional - descomentar si quieres) */}
                          {/* <View style={styles.progressBarContainer}>
                            <View 
                              style={[
                                styles.progressBar, 
                                { width: `${progress}%`, backgroundColor: progress === 100 ? '#4CAF50' : '#df96c0' }
                              ]} 
                            />
                          </View> */}
                          <View style={styles.cardFooter}>
                            <View style={styles.cardHeaderRow}>
                              <Text style={styles.cardTitle} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <View style={styles.actionButtons}>
                                <TouchableOpacity 
                                  style={styles.actionButton}
                                  onPress={() => handleEdit(item)}
                                >
                                  <Text style={styles.actionButtonText}>✎</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={styles.actionButton}
                                  onPress={() => handleDelete(item)}
                                >
                                  <Text style={styles.actionButtonText}>✗</Text>
                                </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.02,
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
  },
  cardImage: {
    width: "100%",
    height: width * 0.37,
    borderRadius: width * 0.02,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#838383',
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
    fontSize: width * 0.030,
  },
  // Stats footer
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: height * 0.02,
    marginTop: height * 0.01,
    borderTopWidth: 4,
    borderTopColor: "#a1a1a1",
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
    color: "#b6b6b6",
    fontSize: width * 0.03,
    fontWeight: "bold",
  },
});

export default FlashcardsScreen;