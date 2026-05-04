import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../constants/theme';
import { getAllNotes, getNotesByType, initDatabase, Note } from '../services/database';
import { useUser } from '../hooks/useUser';

const NotesScreen = () => {
  const [selectedTab, setSelectedTab] = useState<'todas' | 'nota' | 'tarea'>('todas');
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = Colors.light;
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  // Inicializar base de datos al montar
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

   if (userLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#df96c0" />
      </View>
    );
  }

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
            const { deleteNote } = await import('../services/database');
            await deleteNote(id);
            cargarNotas();
          },
        },
      ]
    );
  };

  const renderNote = ({ item }: { item: Note }) => (
    <TouchableOpacity 
      style={[styles.noteCard, { 
        backgroundColor: theme.background,
        borderColor: theme.border,
      }]}
      onPress={() => router.push({ pathname: '/NotaEj', params: { id: item.id } })}
      onLongPress={() => handleDeleteNote(item.id, item.title)}
    >
      <View style={styles.noteHeader}>
        <View style={styles.noteTypeContainer}>
          <View style={[styles.noteTypeDot, { 
            backgroundColor: item.type === 'nota' ? '#df96c0' : '#8f6a7f' 
          }]} />
          <Text style={[styles.noteType, { color: theme.textMuted }, font('sans')]}>
            {item.type === 'nota' ? 'Nota' : 'Tarea'}
          </Text>
          {item.isImportant && (
            <Text style={[styles.importantStar, { color: '#df96c0' }]}> ★</Text>
          )}
        </View>
        <Text style={[styles.noteDate, { color: theme.textMuted }, font('sans')]}>
          {item.date}
        </Text>
      </View>
      
      <Text style={[styles.noteTitle, { color: theme.text }, font('rounded')]}>
        {item.title}
      </Text>
      
      {item.type === 'tarea' && item.tasks && item.tasks.length > 0 && (
        <View style={styles.taskItems}>
          {item.tasks.slice(0, 2).map((task, index) => (
            <View key={index} style={styles.taskItem}>
              <View style={[styles.taskCheckbox, { borderColor: '#df96c0' }]} />
              <Text style={[styles.taskText, { color: theme.textSecondary }, font('sans')]}>
                {task}
              </Text>
            </View>
          ))}
          {item.tasks.length > 2 && (
            <Text style={[styles.moreTasks, { color: theme.textMuted }]}>
              +{item.tasks.length - 2} más
            </Text>
          )}
        </View>
      )}
      
      {item.type === 'nota' && item.content && (
        <Text numberOfLines={2} style={[styles.previewContent, { color: theme.textSecondary }, font('sans')]}>
          {item.content}
        </Text>
      )}
    </TouchableOpacity>
  );

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
            
            <View style={styles.container}>
              {/* Banner */}
              <View style={styles.bannerWrapper}>
                <View style={styles.bannerContainer}>
                  <Image
                    source={require('../assets/images/aD.jpg')}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', theme.background]}
                    style={styles.bannerGradientExtra}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  <View style={styles.bannerOverlay}>
                    <Text style={[styles.bannerTitle, font('rounded')]}>
                      Mis Notas
                    </Text>
                    <Text style={[styles.bannerSubtitle, font('sans')]}>
                      Organiza tu mente 
                    </Text>
                  </View>
                </View>
              </View>

              {/* Header */}
              <View style={styles.header}>
                <Text style={[styles.headerTitle, { color: '#ffffff' }, font('rounded')]}>
                  Notas y Tareas ({notes.length})
                </Text>
              </View>

              {/* Buscador */}
              <View style={[styles.searchContainer, { 
                backgroundColor: theme.background,
                borderColor: theme.border,
              }]}>
                <TextInput
                  style={[styles.searchInput, { color: '#ffffff' }, font('sans')]}
                  placeholder="Buscar notas..."
                  placeholderTextColor={theme.text}
                />
                <TouchableOpacity style={styles.searchButton}>
                  <Text style={styles.searchButtonText}>⌕</Text>
                </TouchableOpacity>
              </View>

              {/* Tabs */}
              <View style={styles.tabContainer}>
                {(['todas', 'nota', 'tarea'] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.tab,
                      selectedTab === tab && styles.tabActive,
                    ]}
                    onPress={() => setSelectedTab(tab)}
                  >
                    <Text style={[
                      styles.tabText,
                      { color: selectedTab === tab ? theme.text : theme.textSecondary },
                      font('sans'),
                      selectedTab === tab && styles.tabTextActive,
                    ]}>
                      {tab === 'todas' ? 'Todas' : tab === 'nota' ? 'Notas' : 'Tareas'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Lista de notas */}
              {loading ? (
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Cargando notas...
                </Text>
              ) : (
                <FlatList
                  data={notes}
                  renderItem={renderNote}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.notesList}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                      No hay notas. Presiona + para crear una.
                    </Text>
                  }
                />
              )}

              {/* Botón flotante */}
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: '#df96c0' }]}
                onPress={() => router.push('/NuevaNota')}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
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
    paddingBottom: 20,
  },
  bannerWrapper: {
    marginHorizontal: -20,
    marginBottom: 8,
  },
  bannerContainer: {
    height: 200,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#ff009900',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerGradientExtra: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 4,
    zIndex: 3,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 16,
    marginTop: -7,
    marginBottom: 10,
    fontWeight: '500',
    color: '#ffffff',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 20,
    paddingLeft: 15,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 20,
    color: '#ffffff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 15,
  },
  tab: {
    paddingBottom: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffffff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  notesList: {
    paddingBottom: 80,
  },
  noteCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowColor: '#00000000',
    shadowRadius: 8,
    elevation: 3,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  noteTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noteTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  noteType: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  noteDate: {
    fontSize: 11,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  importantStar: {
    fontSize: 12,
    marginLeft: 6,
  },
  previewContent: {
    fontSize: 14,
    marginTop: 8,
  },
  taskItems: {
    marginTop: 5,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    marginRight: 10,
  },
  taskText: {
    fontSize: 14,
  },
  moreTasks: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 28,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  addButtonText: {
    fontSize: 32,
    color: '#ffffff',
    fontWeight: '300',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
});

export default NotesScreen;