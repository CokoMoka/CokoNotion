// app/NotaEj.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors, getFontFamily } from '../constants/theme';
import { deleteNote, getNoteById, Note, updateNote } from '../services/database';

type TaskItem = {
  text: string;
  completed: boolean;
};

const NoteDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsImportant, setEditIsImportant] = useState(false);
  const [editTasks, setEditTasks] = useState<TaskItem[]>([]);
  const [editEmoji, setEditEmoji] = useState('');
  const [saving, setSaving] = useState(false);

  const theme = Colors.dark;
  const router = useRouter();

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const normalizeTasks = (tasks: any[]): TaskItem[] => {
    if (!tasks || tasks.length === 0) return [];
    return tasks.map(task => {
      if (typeof task === 'object' && task.text !== undefined) {
        return { text: task.text, completed: task.completed || false };
      }
      if (typeof task === 'string') {
        return { text: task, completed: false };
      }
      return { text: '', completed: false };
    });
  };

  useEffect(() => {
    if (id) {
      cargarNota();
    } else {
      setError('ID de nota no válido');
      setLoading(false);
    }
  }, [id]);

  const cargarNota = async () => {
    setLoading(true);
    setError(null);
    try {
      const nota = await getNoteById(id as string);
      if (nota) {
        setNote(nota);
        setEditTitle(nota.title);
        setEditContent(nota.content || '');
        setEditIsImportant(nota.isImportant);
        setEditTasks(normalizeTasks(nota.tasks || []));
        setEditEmoji(nota.emoji || '');
      } else {
        setError('Nota no encontrada');
      }
    } catch (error) {
      console.error('Error al cargar nota:', error);
      setError('Error al cargar la nota');
    } finally {
      setLoading(false);
    }
  };

  const addTask = () => {
    setEditTasks([...editTasks, { text: '', completed: false }]);
  };

  const updateTask = (text: string, index: number) => {
    const newTasks = [...editTasks];
    newTasks[index] = { ...newTasks[index], text };
    setEditTasks(newTasks);
  };

  // 🔥 FUNCIÓN MODIFICADA: Actualizar contador en Firestore al marcar/desmarcar
  const toggleTaskCompleted = async (index: number) => {
    const wasCompleted = editTasks[index].completed;
    const newTasks = [...editTasks];
    newTasks[index] = { ...newTasks[index], completed: !newTasks[index].completed };
    setEditTasks(newTasks);
    
    // // 🔥 Actualizar contador en Firestore
    // if (!wasCompleted && newTasks[index].completed) {
    //   await incrementUserTasksCompleted();
    // } else if (wasCompleted && !newTasks[index].completed) {
    //   await decrementUserTasksCompleted();
    // }
  };

  const removeTask = (index: number) => {
    const newTasks = editTasks.filter((_, i) => i !== index);
    setEditTasks(newTasks);
  };

const handleSave = async () => {
  if (!editTitle.trim()) {
    Alert.alert('Error', 'El título no puede estar vacío');
    return;
  }

  if (note?.type === 'tarea') {
    const validTasks = editTasks.filter(t => t.text.trim());
    if (validTasks.length === 0) {
      Alert.alert('Error', 'Agrega al menos una tarea');
      return;
    }
  }

  setSaving(true);

  const updates: Partial<Note> = {
    title: editTitle.trim(),
    content: editContent.trim(),
    isImportant: editIsImportant,
  };

  if (note?.type === 'tarea') {
    updates.tasks = editTasks.filter(t => t.text.trim());
  }
  
  if (editEmoji.trim()) {
    updates.emoji = editEmoji.trim();
  } else if (editEmoji === '') {
    updates.emoji = undefined;
  }

  const result = await updateNote(id as string, updates);
  
  if (result.success) {
    setEditing(false);
    cargarNota();
    Alert.alert('Éxito', 'Nota actualizada correctamente');
  } else {
    Alert.alert('Error', 'No se pudo actualizar la nota');
  }
  
  setSaving(false);
};

  const handleDelete = () => {
    Alert.alert(
      'Eliminar nota',
      '¿Estás seguro de eliminar esta nota? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteNote(id as string);
            if (result.success) {
              router.back();
            } else {
              Alert.alert('Error', 'No se pudo eliminar la nota');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <ImageBackground
          source={require('../assets/images/c.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.bearPrimary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Cargando nota...
                </Text>
              </View>
            </SafeAreaView>
          </View>
        </ImageBackground>
      </SafeAreaProvider>
    );
  }

  if (error || !note) {
    return (
      <SafeAreaProvider>
        <ImageBackground
          source={require('../assets/images/c.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={styles.overlay}>
            <SafeAreaView style={styles.safeArea}>
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, { color: theme.textSecondary }]}>
                  {error || 'Nota no encontrada'}
                </Text>
                <TouchableOpacity 
                  style={[styles.retryButton, { backgroundColor: theme.bearPrimary }]} 
                  onPress={cargarNota}
                >
                  <Text style={[styles.retryButtonText, { color: '#ffffff' }]}>
                    Reintentar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonError}>
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
        source={require('../assets/images/c.jpg')}
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
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={[styles.backButton, { color: theme.bearPrimary }]}>←</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.headerActions}>
                    {!editing && (
                      <TouchableOpacity onPress={() => setEditing(true)} style={styles.headerButton}>
                        <Text style={[styles.headerButtonText, { color: theme.bearPrimary }]}>𓂃✍︎</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                      <Text style={[styles.headerButtonText, {marginTop: 6},{ color: theme.textSecondary }]}>✗</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Tipo */}
                <View style={styles.typeBadge}>
                  <Text style={[styles.typeText, { color: note.type === 'nota' ? '#b0a8ad' : '#8f6a7f' }, font('sans')]}>
                    {note.type === 'nota' ? '✐ᝰ Nota' : '✓ Tarea'}
                  </Text>
                  {note.isImportant && (
                    <View style={[styles.importantBadge, { backgroundColor: '#df96c020' }]}>
                      <Text style={[styles.importantText, { color: '#b0a8ad' }]}>★ Importante</Text>
                    </View>
                  )}
                </View>

                {/* Fecha */}
                <Text style={[styles.date, { color: theme.textMuted }, font('sans')]}>
                  {note.date}
                </Text>

                {/* Modo edición */}
                {editing ? (
                  <>
                    <View style={styles.emojiSection}>
                      <Text style={[styles.emojiLabel, { color: theme.textSecondary }, font('sans')]}>
                        Icono
                      </Text>
                      <TextInput
                        style={[styles.emojiInput, { color: theme.text, borderColor: theme.border }, font('sans')]}
                        placeholder="🙊"
                        placeholderTextColor={theme.textMuted}
                        value={editEmoji}
                        onChangeText={setEditEmoji}
                        maxLength={2}
                      />
                    </View>

                    <TextInput
                      style={[styles.editTitle, { color: theme.text }, font('rounded')]}
                      placeholder="Título"
                      placeholderTextColor={theme.textMuted}
                      value={editTitle}
                      onChangeText={setEditTitle}
                    />

                    <View style={styles.importanceSection}>
                      <View style={styles.importanceLeft}>
                        <Text style={[styles.importanceIcon, { color: theme.bearPrimary }]}>★</Text>
                        <Text style={[styles.importanceLabel, { color: theme.text }, font('sans')]}>
                          Marcar como importante
                        </Text>
                      </View>
                      <Switch
                        value={editIsImportant}
                        onValueChange={setEditIsImportant}
                        trackColor={{ false: '#3a3a3a', true: theme.bearPrimary }}
                        thumbColor={editIsImportant ? theme.bearSecondary : '#ffffff'}
                      />
                    </View>

                    {note.type === 'nota' && (
                      <TextInput
                        style={[styles.editContent, { color: theme.text }, font('sans')]}
                        placeholder="Escribe tu nota..."
                        placeholderTextColor={theme.textMuted}
                        multiline
                        textAlignVertical="top"
                        value={editContent}
                        onChangeText={setEditContent}
                      />
                    )}

                    {note.type === 'tarea' && (
                      <View style={styles.tasksSection}>
                        <View style={styles.tasksHeader}>
                          <Text style={[styles.tasksHeaderLabel, { color: theme.textSecondary }, font('sans')]}>
                            Subtareas
                          </Text>
                          <TouchableOpacity onPress={addTask}>
                            <Text style={[styles.addTaskText, { color: theme.bearPrimary }]}>+ Añadir</Text>
                          </TouchableOpacity>
                        </View>

                        {editTasks.map((task, index) => (
                          <View key={index} style={styles.taskItemContainer}>
                            <TouchableOpacity onPress={() => toggleTaskCompleted(index)}>
                              <View style={[styles.taskCheckbox, { 
                                backgroundColor: task.completed ? theme.bearPrimary : 'transparent',
                                borderColor: theme.bearPrimary
                              }]}>
                                {task.completed && <Text style={styles.checkmark}>✓</Text>}
                              </View>
                            </TouchableOpacity>
                            <TextInput
                              style={[styles.taskInput, { 
                                color: theme.text,
                                textDecorationLine: task.completed ? 'line-through' : 'none',
                              }, font('sans')]}
                              placeholder={`Tarea ${index + 1}`}
                              placeholderTextColor={theme.textMuted}
                              value={task.text}
                              onChangeText={(text) => updateTask(text, index)}
                            />
                            <TouchableOpacity onPress={() => removeTask(index)}>
                              <Text style={[styles.removeTaskText, { color: theme.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <View style={styles.editButtons}>
                      <TouchableOpacity 
                        style={[styles.cancelButton, { borderColor: theme.border }]}
                        onPress={() => {
                          setEditing(false);
                          cargarNota();
                        }}
                      >
                        <Text style={[styles.cancelButtonText, { color: theme.textSecondary }]}>
                          Cancelar
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.saveButton, { backgroundColor: theme.bearPrimary }]}
                        onPress={handleSave}
                        disabled={saving}
                      >
                        <Text style={[styles.saveButtonText, { color: '#ffffff' }]}>
                          {saving ? 'Guardando...' : 'Guardar cambios'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    {note.emoji && (
                      <Text style={[styles.emojiDisplay, { fontSize: 48, marginBottom: 8 }]}>
                        {note.emoji}
                      </Text>
                    )}

                    <Text style={[styles.title, { color: theme.text }, font('rounded')]}>
                      {note.title}
                    </Text>

                    {note.type === 'nota' && note.content && (
                      <Text style={[styles.content, { color: theme.textSecondary }, font('sans')]}>
                        {note.content}
                      </Text>
                    )}

                    {note.type === 'tarea' && note.tasks && note.tasks.length > 0 && (
                      <View style={styles.tasksContainer}>
                        <Text style={[styles.tasksTitle, { color: theme.textSecondary }, font('sans')]}>
                          Subtareas:
                        </Text>
                        {(() => {
                          const displayTasks = normalizeTasks(note.tasks);
                          return displayTasks.map((task, index) => (
                            <View key={index} style={styles.taskRow}>
                              <View style={[styles.checkbox, { 
                                backgroundColor: task.completed ? '#b0a8ad' : 'transparent',
                                borderColor: '#b0a8ad'
                              }]}>
                                {task.completed && <Text style={styles.checkmarkSmall}>✓</Text>}
                              </View>
                              <Text style={[
                                styles.taskText, 
                                { 
                                  color: theme.text,
                                  textDecorationLine: task.completed ? 'line-through' : 'none',
                                  opacity: task.completed ? 0.6 : 1
                                }, 
                                font('sans')
                              ]}>
                                {task.text}
                              </Text>
                            </View>
                          ));
                        })()}
                      </View>
                    )}
                  </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backButtonError: {
    paddingVertical: 8,
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
  },
  backButton: {
    fontSize: 28,
    fontWeight: '300',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  headerButtonText: {
    fontSize: 22,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  importantBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  importantText: {
    fontSize: 11,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 8,
  },
  emojiSection: {
    marginBottom: 16,
  },
  emojiLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emojiInput: {
    padding: 12,
    fontSize: 40,
    textAlign: 'left',
    width: 80,
  },
  emojiDisplay: {
    textAlign: 'left',
  },
  editTitle: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    padding: 0,
  },
  editContent: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    padding: 0,
    marginTop: 8,
  },
  importanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  importanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  importanceIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  importanceLabel: {
    fontSize: 15,
  },
  tasksSection: {
    marginTop: 8,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksHeaderLabel: {
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addTaskText: {
    fontSize: 14,
    fontWeight: '500',
  },
  taskItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkmarkSmall: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  taskInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  removeTaskText: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
  tasksContainer: {
    marginTop: 16,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NoteDetailScreen;