// app/(tabs)/Notas.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  View,
  Image,
  Text,
  TextInput,
  ImageBackground,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppImages } from "../../constants/images";
import { getAllNotes, getNotesByType, initDatabase, Note, deleteNote, updateNote } from '../../services/database';
import { useUser } from '../../hooks/useUser';

export default function NotasScreen() {
  const { width, height } = useWindowDimensions();
  const scale = width / 390;
  const s = (value: number) => value * scale;
  const v = (value: number) => value * (height / 844);

  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  
  // Estados de la lógica
  const [selectedTab, setSelectedTab] = useState<'todas' | 'nota' | 'tarea' | 'favoritos'>('todas');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estado para el emoji de favoritos (editable)
  const [favoriteEmoji, setFavoriteEmoji] = useState("🍙");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // 🔥 Referencia para detectar deslizamiento
  const isSwiping = useRef(false);

  // 🔥 PanResponder para detectar deslizamiento global
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 30;
      },
      onPanResponderGrant: () => {
        isSwiping.current = true;
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50 && isSwiping.current) {
          router.push('/NuevaNota');
        }
        isSwiping.current = false;
      },
      onPanResponderTerminate: () => {
        isSwiping.current = false;
      },
    })
  ).current;

  // Inicializar base de datos
  useEffect(() => {
    if (user) {
      iniciarDB();
    }
  }, [user]);

  const iniciarDB = async () => {
    await initDatabase();
    await cargarNotas();
  };

  useFocusEffect(
    useCallback(() => {
      cargarNotas();
    }, [selectedTab])
  );

  const cargarNotas = async () => {
    setLoading(true);
    try {
      let notas;
      if (selectedTab === 'todas') {
        notas = await getAllNotes();
      } else if (selectedTab === 'favoritos') {
        const todas = await getAllNotes();
        notas = todas.filter(n => n.isImportant === true);
      } else {
        notas = await getNotesByType(selectedTab);
      }
      setNotes(notas);
    } catch (error) {
      console.error('Error al cargar notas:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorites = () => {
    if (selectedTab === 'favoritos') {
      setSelectedTab('todas');
    } else {
      setSelectedTab('favoritos');
    }
  };

  const handleDeleteNote = (id: string, title: string) => {
    Alert.alert(
      'Eliminar nota',
      `¿Estás seguro de eliminar "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteNote(id);
            cargarNotas();
          },
        },
      ]
    );
  };

  const getFirstTaskText = (tasks: any[]): string => {
    if (!tasks || tasks.length === 0) return '';
    const firstTask = tasks[0];
    if (typeof firstTask === 'object' && firstTask.text) {
      return firstTask.text;
    }
    if (typeof firstTask === 'string') {
      return firstTask;
    }
    return '';
  };

  const getPendingTasksCount = (tasks: any[]): number => {
    if (!tasks || tasks.length === 0) return 0;
    if (tasks[0] && typeof tasks[0] === 'object' && 'completed' in tasks[0]) {
      return tasks.filter(t => !t.completed).length;
    }
    return tasks.length;
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (note.content && note.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalCount = notes.length;
  const notasCount = notes.filter(n => n.type === 'nota').length;
  const tareasCount = notes.filter(n => n.type === 'tarea').length;
  const favoritosCount = notes.filter(n => n.isImportant === true).length;

  if (userLoading) {
    return (
      <View style={styles.mainContainer}>
        <ImageBackground
          source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
          style={styles.fullScreenBackground}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#df96c0" />
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
        source={AppImages.backgroundImg || require('../../assets/images/bD.jpg')}
        style={styles.fullScreenBackground}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <SafeAreaView style={styles.safeArea}>
            {/* 🔥 Contenedor con PanResponder para detectar deslizamiento */}
            <View {...panResponder.panHandlers} style={styles.gestureContainer}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.container, { paddingBottom: v(30) }]}>

                  {/* ========== HEADER ========== */}
                  <View style={[styles.header, {
                    marginBottom: v(15),
                    marginHorizontal: s(20),
                    marginTop: v(10),
                  }]}>
                    <Text style={[styles.headerTitle, {
                      fontSize: s(28),
                      color: "#FFFFFF",
                      fontWeight: "bold",
                    }]}>
                      Notas y Tareas
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/NuevaNota')}>
                      <Text style={[styles.addButton, {
                        fontSize: s(32),
                        color: "#FFFFFF",
                        fontWeight: "bold",
                      }]}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* ========== BUSCADOR ========== */}
                  <View style={[styles.searchContainer, {
                    marginHorizontal: s(20),
                    marginBottom: v(15),
                    backgroundColor: "rgba(46, 46, 46, 0.95)",
                    borderRadius: s(20),
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: s(16),
                  }]}>
                    <TextInput
                      style={[styles.searchInput, {
                        fontSize: s(14),
                        color: "#FFFFFF",
                        flex: 1,
                        paddingVertical: v(12),
                      }]}
                      placeholder="Buscar notas..."
                      placeholderTextColor="#888888"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    <Text style={{ fontSize: s(18), color: "#888888" }}>⌕</Text>
                  </View>

                  {/* ========== SECCIÓN DE FAVORITOS ========== */}
                  <TouchableOpacity 
                    style={[styles.favoritesCard, {
                      borderRadius: s(20),
                      paddingVertical: v(12),
                      paddingHorizontal: s(20),
                      marginBottom: v(15),
                      marginHorizontal: s(20),
                      backgroundColor: selectedTab === 'favoritos' ? "#e9dbe3" : "#434343",
                      alignItems: "flex-start",
                    }]}
                    onPress={toggleFavorites}
                    activeOpacity={0.7}
                  >
                    <TextInput
                      style={[styles.favEmojiInput, {
                        fontSize: s(40),
                        width: s(60),
                        textAlign: "center",
                        color: selectedTab === 'favoritos' ? "#FFFFFF" : "#FFFFFF",
                        marginBottom: v(4),
                        borderRadius: s(12),
                        paddingHorizontal: s(8),
                        paddingVertical: s(4),
                      }]}
                      value={favoriteEmoji}
                      onChangeText={setFavoriteEmoji}
                      maxLength={2}
                      placeholder="🦜"
                      placeholderTextColor="#737373"
                      editable={false}
                    />
                    <Text style={[styles.favText, {
                      fontSize: s(14),
                      color: selectedTab === 'favoritos' ? "#FFFFFF" : "#737373",
                    }]}>
                       Favoritos ({favoritosCount})
                    </Text>
                    {selectedTab === 'favoritos' && (
                      <Text style={[styles.favActiveHint, { fontSize: s(10), color: "#FFFFFF", marginTop: v(4), opacity: 0.8 }]}>
                        Mostrando solo favoritos • Toca para ver todo
                      </Text>
                    )}
                  </TouchableOpacity>

                  {/* ========== FILTROS ========== */}
                  {selectedTab !== 'favoritos' && (
                    <View style={[styles.filtersRow, {
                      marginBottom: v(12),
                      marginHorizontal: s(20),
                    }]}>
                      <TouchableOpacity onPress={() => setSelectedTab('todas')}>
                        <Text style={[styles.filterText, {
                          fontSize: s(16),
                          color: selectedTab === 'todas' ? "#FFFFFF" : "#737373",
                          fontWeight: selectedTab === 'todas' ? "bold" : "500",
                        }]}>
                          Todo ({totalCount})
                        </Text>
                      </TouchableOpacity>
                      <View style={{ flex: 1 }} />
                      <TouchableOpacity onPress={() => setSelectedTab('tarea')}>
                        <Text style={[styles.filterText, {
                          fontSize: s(16),
                          color: selectedTab === 'tarea' ? "#FFFFFF" : "#737373",
                          fontWeight: selectedTab === 'tarea' ? "bold" : "500",
                          marginRight: s(20),
                        }]}>
                          Tareas ({tareasCount})
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setSelectedTab('nota')}>
                        <Text style={[styles.filterText, {
                          fontSize: s(16),
                          color: selectedTab === 'nota' ? "#FFFFFF" : "#737373",
                          fontWeight: selectedTab === 'nota' ? "bold" : "500",
                        }]}>
                          Notas ({notasCount})
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* ========== LISTA DE NOTAS Y TAREAS ========== */}
                  <View style={[styles.listCard, {
                    borderRadius: s(20),
                    paddingTop: v(12),
                    paddingHorizontal: s(16),
                    marginBottom: v(20),
                    marginHorizontal: s(20),
                    backgroundColor: "rgba(46, 46, 46, 0.95)",
                    minHeight: v(110),
                  }]}>
                    {loading ? (
                      <View style={{ paddingVertical: v(40), alignItems: 'center' }}>
                        <ActivityIndicator size="small" color="#df96c0" />
                        <Text style={{ color: "#888888", marginTop: v(8), fontSize: s(12) }}>Cargando...</Text>
                      </View>
                    ) : filteredNotes.length === 0 ? (
                      <View style={{ paddingVertical: v(40), alignItems: 'center' }}>
                        <Text style={{ color: "#888888", fontSize: s(14) }}>
                          {selectedTab === 'favoritos' ? 'No hay notas favoritas' : 'No hay notas'}
                        </Text>
                        <Text style={{ color: "#666666", fontSize: s(12), marginTop: v(4) }}>
                          {selectedTab === 'favoritos' ? 'Marca una nota como importante' : 'Presiona + para crear una'}
                        </Text>
                      </View>
                    ) : (
                      filteredNotes.map((item, index) => {
                        const pendingCount = item.type === 'tarea' && item.tasks ? getPendingTasksCount(item.tasks) : 0;
                        const firstTaskText = item.type === 'tarea' && item.tasks ? getFirstTaskText(item.tasks) : '';
                        
                        return (
                          <TouchableOpacity 
                            key={item.id}
                            style={{ marginBottom: index === filteredNotes.length - 1 ? v(12) : v(16) }}
                            onPress={() => router.push({ pathname: '/NotaEj', params: { id: item.id } })}
                            onLongPress={() => handleDeleteNote(item.id, item.title)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.itemRow}>
                              <Text style={[styles.itemIcon, { fontSize: s(24), marginRight: s(12) }]}>
                                {item.emoji || (item.type === 'nota' ? '📝' : '✅')}
                              </Text>
                              <View style={styles.itemContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(8) }}>
                                  <Text style={[styles.itemTitle, {
                                    fontSize: s(16),
                                    color: "#FFFFFF",
                                    fontWeight: "bold",
                                    flex: 1,
                                  }]} numberOfLines={1}>
                                    {item.title}
                                  </Text>
                                  {item.isImportant && (
                                    <Text style={{ fontSize: s(12), color: "#df96c0" }}> ¡!</Text>
                                  )}
                                </View>
                                <Text style={[styles.itemDate, {
                                  fontSize: s(11),
                                  color: "#656565",
                                  marginTop: v(2),
                                }]}>
                                  {item.date}
                                </Text>
                                {item.type === 'tarea' && item.tasks && item.tasks.length > 0 && (
                                  <Text style={[styles.itemPreview, { fontSize: s(11), color: "#737373", marginTop: v(4) }]} numberOfLines={1}>
                                    {pendingCount > 0 ? `☐ ${firstTaskText.substring(0, 30)}` : `✓ Todas completadas (${item.tasks.length})`}
                                    {pendingCount > 1 ? ` +${pendingCount - 1} más` : ''}
                                  </Text>
                                )}
                                {item.type === 'nota' && item.content && (
                                  <Text style={[styles.itemPreview, { fontSize: s(11), color: "#737373", marginTop: v(4) }]} numberOfLines={1}>
                                    {item.content}
                                  </Text>
                                )}
                              </View>
                            </View>
                            {index < filteredNotes.length - 1 && (
                              <View style={[styles.divider, {
                                height: s(1),
                                backgroundColor: "#4A4A4A",
                                marginTop: v(12),
                              }]} />
                            )}
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>

                </View>
              </ScrollView>
            </View>
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
  gestureContainer: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {},
  addButton: {},
  // Search
  searchContainer: {},
  searchInput: {},
  // Favorites Card
  favoritesCard: {},
  favEmojiInput: {},
  favText: {},
  favActiveHint: {},
  // Filters
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterText: {},
  // List Card
  listCard: {},
  itemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  itemIcon: {
    minWidth: 36,
    textAlign: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {},
  itemDate: {},
  itemPreview: {},
  divider: {},
});