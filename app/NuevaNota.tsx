// app/(tabs)/NuevaNota.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { saveNote, getDefaultEmoji } from '../services/database';

type NoteType = 'nota' | 'tarea';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

const NewNoteScreen = () => {
  const [noteType, setNoteType] = useState<NoteType>('nota');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [tasks, setTasks] = useState<TaskItem[]>([{ id: Date.now().toString(), text: '', completed: false }]);
  const [isImportant, setIsImportant] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteEmoji, setNoteEmoji] = useState('');

  const theme = Colors.dark;
  const router = useRouter();

  const font = (type: 'sans' | 'rounded' | 'mono' = 'sans') => ({
    fontFamily: getFontFamily(Platform.OS, type),
  });

  const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 6);

  const addTask = () => {
    setTasks([...tasks, { id: generateId(), text: '', completed: false }]);
  };

  const updateTask = (text: string, index: number) => {
    const newTasks = [...tasks];
    newTasks[index].text = text;
    setTasks(newTasks);
  };

  const toggleTaskCompleted = (index: number) => {
    const newTasks = [...tasks];
    newTasks[index].completed = !newTasks[index].completed;
    setTasks(newTasks);
  };

  const removeTask = (index: number) => {
    if (tasks.length === 1 && !tasks[0].text.trim()) {
      setTasks([{ id: generateId(), text: '', completed: false }]);
    } else {
      const newTasks = tasks.filter((_, i) => i !== index);
      setTasks(newTasks.length ? newTasks : [{ id: generateId(), text: '', completed: false }]);
    }
  };

  const handleSave = async () => {
    if (!noteTitle.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título');
      return;
    }

    if (noteType === 'tarea') {
      const validTasks = tasks.filter(t => t.text.trim());
      if (validTasks.length === 0) {
        Alert.alert('Error', 'Agrega al menos una tarea');
        return;
      }
    }

    setSaving(true);

    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;

    const newNote = {
      title: noteTitle.trim(),
      content: noteContent.trim(),
      type: noteType,
      date: dateStr,
      isImportant,
      tasks: noteType === 'tarea' ? tasks.filter(t => t.text.trim()).map(t => ({ text: t.text, completed: t.completed })) : undefined,
      emoji: noteEmoji.trim() || undefined,
    };

    try {
      const result = await saveNote(newNote);
      
      if (result.success) {
        Alert.alert('Éxito', 'Nota guardada correctamente', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', 'No se pudo guardar la nota');
      }
    } catch (error) {
      console.error('Error en handleSave:', error);
      Alert.alert('Error', 'Ocurrió un error al guardar');
    } finally {
      setSaving(false);
    }
  };

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
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <View style={styles.container}>
                {/* HEADER */}
                <View style={styles.header}>
                  <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                    <Text style={styles.closeButtonText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={[styles.headerTitle, font('rounded')]}>
                    {noteType === 'nota' ? 'Nueva Nota' : 'Nueva Tarea'}
                  </Text>
                  <TouchableOpacity style={styles.saveHeaderButton} onPress={handleSave} disabled={saving}>
                    <Text style={[styles.saveHeaderText, { color: theme.bearPrimary }]}>
                      {saving ? 'Guardando...' : 'Guardar'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Campo de emoji */}
                <View style={styles.emojiSection}>
                  <Text style={[styles.emojiLabel, { color: theme.textSecondary }, font('sans')]}>
                    Icono
                  </Text>
                  <TextInput
                    style={[styles.emojiInput, { color: theme.text, borderColor: theme.border }, font('sans')]}
                    placeholder="✍️"
                    placeholderTextColor={theme.textMuted}
                    value={noteEmoji}
                    onChangeText={setNoteEmoji}
                    maxLength={2}
                  />
                </View>

                {/* Selector de tipo */}
                <View style={styles.typeSelector}>
                  <TouchableOpacity
                    style={[styles.typeOption, noteType === 'nota' && styles.typeOptionActive]}
                    onPress={() => setNoteType('nota')}
                  >
                    <Text style={[styles.typeOptionText, { color: noteType === 'nota' ? theme.bearPrimary : theme.textSecondary }, font('sans')]}>
                      ᝰ.ᐟ Nota
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeOption, noteType === 'tarea' && styles.typeOptionActive]}
                    onPress={() => setNoteType('tarea')}
                  >
                    <Text style={[styles.typeOptionText, { color: noteType === 'tarea' ? theme.bearPrimary : theme.textSecondary }, font('sans')]}>
                      ✓ Tarea
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Título */}
                <TextInput
                  style={[styles.titleInput, { color: theme.text }, font('rounded')]}
                  placeholder="Título"
                  placeholderTextColor={theme.textMuted}
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                />

                {/* Importancia */}
                <View style={styles.importanceSection}>
                  <View style={styles.importanceLeft}>
                    <Text style={[styles.importanceIcon, { color: theme.bearPrimary }]}> ★</Text>
                    <Text style={[styles.importanceLabel, { color: theme.text }, font('sans')]}>
                      Marcar como importante
                    </Text>
                  </View>
                  <Switch
                    value={isImportant}
                    onValueChange={setIsImportant}
                    trackColor={{ false: '#3a3a3a', true: theme.bearPrimary }}
                    thumbColor={isImportant ? theme.bearSecondary : '#ffffff'}
                  />
                </View>

                {/* Contenido para nota */}
                {noteType === 'nota' && (
                  <TextInput
                    style={[styles.contentInput, { color: theme.text }, font('sans')]}
                    placeholder="Escribe tu nota..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    textAlignVertical="top"
                    value={noteContent}
                    onChangeText={setNoteContent}
                  />
                )}

                {/* Lista de tareas */}
                {noteType === 'tarea' && (
                  <View style={styles.tasksSection}>
                    <View style={styles.tasksHeader}>
                      <Text style={[styles.tasksHeaderLabel, { color: theme.textSecondary }, font('sans')]}>
                        Subtareas
                      </Text>
                      <TouchableOpacity onPress={addTask}>
                        <Text style={[styles.addTaskText, { color: theme.bearPrimary }]}>+ Añadir</Text>
                      </TouchableOpacity>
                    </View>

                    {tasks.map((task, index) => (
                      <View key={task.id} style={styles.taskItemContainer}>
                        <TouchableOpacity onPress={() => toggleTaskCompleted(index)}>
                          <View style={[styles.taskCheckbox, { 
                            backgroundColor: task.completed ? theme.bearPrimary : 'transparent',
                            borderColor: theme.bearPrimary
                          }]}>
                            {task.completed && <Text style={styles.checkmark}>✓</Text>}
                          </View>
                        </TouchableOpacity>
                        
                        <TextInput
                          style={[
                            styles.taskInput, 
                            { 
                              color: task.completed ? '#888888' : theme.text,
                              textDecorationLine: task.completed ? 'line-through' : 'none',
                            }, 
                            font('sans')
                          ]}
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
    backgroundColor: 'rgba(46, 46, 46, 0.3)',
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 40,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  saveHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveHeaderText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emojiSection: {
    marginBottom: 20,
  },
  emojiLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 1,
  },
  emojiInput: {
    padding: 12,
    fontSize: 40,
    textAlign: 'center',
    width: 80,
    marginLeft: -17,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 25,
    gap: 20,
  },
  typeOption: {
    paddingBottom: 8,
  },
  typeOptionActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#df96c0',
  },
  typeOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 15,
    padding: 0,
  },
  importanceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
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
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    padding: 0,
    minHeight: 200,
  },
  tasksSection: {
    marginTop: 5,
    marginBottom: 20,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
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
    marginBottom: 15,
  },
  taskCheckbox: {
    width: 22,
    height: 22,
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
  taskInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  removeTaskText: {
    fontSize: 16,
    paddingHorizontal: 8,
  },
});

export default NewNoteScreen;