// services/database.ts - VERSIÓN COMPLETA CON AUDITORÍA PARA MAPAS

import * as SQLite from 'expo-sqlite';
import { getCurrentUser } from './auth';
import { logAudit } from './auditLogger';

// ========== CONSTANTES Y TIPOS ==========

const DEFAULT_EMOJIS = ['📝', '📌', '💡', '📖', '✏️', '📓', '📚', '🔖', '✨', '⭐', '🌸', '🎯'];

export interface Note {
  id: string;
  userId: string;     
  title: string;
  content: string;
  type: 'nota' | 'tarea';
  date: string;
  isImportant: boolean;
  tasks?: any[];
  emoji?: string;
}

interface NoteRow {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'nota' | 'tarea';
  date: string;
  isImportant: number;
  tasks: string | null;
  emoji: string | null;
}

// ========== GESTIÓN DE BASE DE DATOS ==========

let database: SQLite.SQLiteDatabase | null = null;
let isInitialized = false;

const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    try {
      database = SQLite.openDatabaseSync('notes.db');
      console.log('✅ SQLite abierta');
    } catch (error) {
      console.error('❌ Error al abrir SQLite:', error);
      throw error;
    }
  }
  return database;
};

const getCurrentUserId = (): string | null => {
  try {
    const user = getCurrentUser();
    return user?.uid || null;
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    return null;
  }
};

const getConsistentEmoji = (id: string): string => {
  const index = Math.abs(id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % DEFAULT_EMOJIS.length;
  return DEFAULT_EMOJIS[index];
};

export const getDefaultEmoji = (title?: string): string => {
  if (title && title.length > 0) {
    const firstChar = title.charAt(0).toUpperCase();
    const emojiMap: { [key: string]: string } = {
      'A': '🍎', 'B': '📘', 'C': '☕', 'D': '🎵', 'E': '📧', 'F': '🔥',
      'G': '🎮', 'H': '❤️', 'I': '💡', 'J': '👑', 'K': '🔑', 'L': '📒',
      'M': '📱', 'N': '📰', 'O': '🕒', 'P': '📌', 'Q': '❓', 'R': '🎀',
      'S': '⭐', 'T': '📏', 'U': '☂️', 'V': '✅', 'W': '🌍', 'X': '❌',
      'Y': '💛', 'Z': '⚡'
    };
    return emojiMap[firstChar] || DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
  }
  return DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];
};

const mapRowToNote = (row: NoteRow): Note => {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    content: row.content,
    type: row.type,
    date: row.date,
    isImportant: row.isImportant === 1,
    tasks: row.tasks ? JSON.parse(row.tasks) : undefined,
    emoji: row.emoji || getConsistentEmoji(row.id),
  };
};

// ========== INICIALIZACIÓN ==========

export const initDatabase = async (): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('⚠️ No hay usuario autenticado, omitiendo inicialización de SQLite');
      return;
    }
    
    if (isInitialized) {
      console.log('ℹ️ SQLite ya inicializada');
      return;
    }
    
    const db = getDatabase();
    
    // 🔥 CREAR TABLA DE NOTAS
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        isImportant INTEGER DEFAULT 0,
        tasks TEXT,
        emoji TEXT
      );
    `);
    
    // 🔥 CREAR TABLA DE PUNTOS DE ESTUDIO (MAPAS)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS study_points (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        createdAt TEXT NOT NULL,
        notes TEXT,
        category TEXT,
        rating INTEGER DEFAULT 0
      );
    `);
    
    // 🔥 AÑADIR COLUMNAS ADICIONALES SI NO EXISTEN
    try {
      await db.execAsync(`ALTER TABLE study_points ADD COLUMN category TEXT;`);
      console.log('✅ Columna category añadida');
    } catch (e: any) {
      if (!e?.message?.includes('duplicate')) console.log('ℹ️ Columna category ya existe');
    }
    
    try {
      await db.execAsync(`ALTER TABLE study_points ADD COLUMN rating INTEGER DEFAULT 0;`);
      console.log('✅ Columna rating añadida');
    } catch (e: any) {
      if (!e?.message?.includes('duplicate')) console.log('ℹ️ Columna rating ya existe');
    }
    
    isInitialized = true;
    console.log('✅ Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('❌ Error en initDatabase:', error);
  }
};

// ========== OPERACIONES CRUD NOTAS ==========

export const getAllNotes = async (): Promise<Note[]> => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('⚠️ No hay usuario autenticado, retornando array vacío');
    return [];
  }
  
  try {
    const database = getDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM notes WHERE userId = ? ORDER BY date DESC',
      [userId]
    );
    return (result as NoteRow[]).map(mapRowToNote);
  } catch (error) {
    console.error('Error al obtener notas:', error);
    return [];
  }
};

export const getNotesByType = async (type: 'nota' | 'tarea'): Promise<Note[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  try {
    const database = getDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM notes WHERE userId = ? AND type = ? ORDER BY date DESC',
      [userId, type]
    );
    return (result as NoteRow[]).map(mapRowToNote);
  } catch (error) {
    console.error('Error al obtener notas por tipo:', error);
    return [];
  }
};

export const getNoteById = async (id: string): Promise<Note | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  try {
    const database = getDatabase();
    const result = await database.getFirstAsync(
      'SELECT * FROM notes WHERE id = ? AND userId = ?',
      [id, userId]
    );
    if (result) {
      return mapRowToNote(result as NoteRow);
    }
    return null;
  } catch (error) {
    console.error('Error al obtener nota por ID:', error);
    return null;
  }
};

export const saveNote = async (note: Omit<Note, 'id' | 'userId'> & { id?: string }) => {
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, error: 'Usuario no autenticado' };
  }
  
  try {
    const database = getDatabase();
    const id = note.id || Date.now().toString();
    const tasksJSON = note.tasks ? JSON.stringify(note.tasks) : null;
    const emoji = note.emoji || getDefaultEmoji(note.title);
    
    await database.runAsync(
      `INSERT OR REPLACE INTO notes (id, userId, title, content, type, date, isImportant, tasks, emoji) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, note.title, note.content || '', note.type, note.date, note.isImportant ? 1 : 0, tasksJSON, emoji]
    );
    
    const action = note.type === 'tarea' ? 'CREATE_TASK' : 'CREATE_NOTE';
    await logAudit(
      action,
      id,
      note.title,
      `Creado con ${note.tasks?.length || 0} subtareas`,
      null,
      { title: note.title, content: note.content, tasksCount: note.tasks?.length || 0 }
    );
    
    return { success: true, id };
  } catch (error) {
    console.error('Error al guardar nota:', error);
    return { success: false, error };
  }
};

export const updateNote = async (id: string, updates: Partial<Note>) => {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, error: 'Usuario no autenticado' };
  
  try {
    const oldNote = await getNoteById(id);
    if (!oldNote) return { success: false, error: 'Nota no encontrada' };
    
    const database = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    let changes: string[] = [];
    
    if (updates.title !== undefined && updates.title !== oldNote.title) {
      fields.push('title = ?');
      values.push(updates.title);
      changes.push(`Título: "${oldNote.title}" → "${updates.title}"`);
    }
    if (updates.content !== undefined && updates.content !== oldNote.content) {
      fields.push('content = ?');
      values.push(updates.content);
      changes.push('Contenido modificado');
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.isImportant !== undefined && updates.isImportant !== oldNote.isImportant) {
      fields.push('isImportant = ?');
      values.push(updates.isImportant ? 1 : 0);
      changes.push(updates.isImportant ? 'Marcada como importante' : 'Desmarcada como importante');
    }
    if (updates.tasks !== undefined) {
      fields.push('tasks = ?');
      values.push(JSON.stringify(updates.tasks));
      changes.push('Subtareas actualizadas');
    }
    if (updates.emoji !== undefined && updates.emoji !== oldNote.emoji) {
      fields.push('emoji = ?');
      values.push(updates.emoji);
      changes.push(`Emoji: ${oldNote.emoji} → ${updates.emoji}`);
    }
    
    if (fields.length === 0) {
      return { success: true };
    }
    
    values.push(id);
    values.push(userId);
    
    await database.runAsync(
      `UPDATE notes SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );
    
    if (changes.length > 0) {
      await logAudit(
        oldNote.type === 'tarea' ? 'UPDATE_TASK' : 'UPDATE_NOTE',
        id,
        oldNote.title,
        changes.join('; '),
        { previous: { title: oldNote.title, content: oldNote.content, isImportant: oldNote.isImportant } },
        { new: updates }
      );
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar nota:', error);
    return { success: false, error };
  }
};

export const deleteNote = async (id: string) => {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, error: 'Usuario no autenticado' };
  
  try {
    const noteToDelete = await getNoteById(id);
    if (!noteToDelete) return { success: false, error: 'Nota no encontrada' };
    
    const database = getDatabase();
    await database.runAsync(
      'DELETE FROM notes WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    await logAudit(
      noteToDelete.type === 'tarea' ? 'DELETE_TASK' : 'DELETE_NOTE',
      id,
      noteToDelete.title,
      'Eliminada permanentemente',
      { title: noteToDelete.title, content: noteToDelete.content },
      null
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    return { success: false, error };
  }
};

// ========== PUNTOS DE ESTUDIO (MAPAS) CON AUDITORÍA COMPLETA ==========

export interface StudyPoint {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  notes?: string;
  category?: string;
  rating?: number;
}

// 🔥 Obtener punto por ID
export const getStudyPointById = async (id: string): Promise<StudyPoint | null> => {
  const userId = getCurrentUserId();
  if (!userId) return null;
  
  try {
    const database = getDatabase();
    const result = await database.getFirstAsync(
      'SELECT * FROM study_points WHERE id = ? AND userId = ?',
      [id, userId]
    );
    return result as StudyPoint | null;
  } catch (error) {
    console.error('Error al obtener punto de estudio:', error);
    return null;
  }
};

// 🔥 Obtener todos los puntos
export const getStudyPoints = async (): Promise<StudyPoint[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  try {
    const database = getDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM study_points WHERE userId = ? ORDER BY createdAt DESC',
      [userId]
    );
    return result as StudyPoint[];
  } catch (error) {
    console.error('Error al obtener puntos de estudio:', error);
    return [];
  }
};

// 🔥 Guardar punto de estudio (CREAR)
export const saveStudyPoint = async (point: Omit<StudyPoint, 'id' | 'userId' | 'createdAt'>): Promise<{ success: boolean; id?: string; error?: string }> => {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, error: 'Usuario no autenticado' };
  
  try {
    const database = getDatabase();
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO study_points (id, userId, name, latitude, longitude, createdAt, notes, category, rating) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, point.name, point.latitude, point.longitude, createdAt, point.notes || null, point.category || null, point.rating || 0]
    );
    // ✅ AUDITORÍA: Creación de punto de estudio
    await logAudit(
      'CREATE_STUDY_POINT', // 🔥 Nuevo tipo de acción
      id,
      point.name,
      `Punto de estudio creado en coordenadas (${point.latitude}, ${point.longitude})`,
      null,
      {
        name: point.name,
        latitude: point.latitude,
        longitude: point.longitude,
        category: point.category,
        notes: point.notes
      }
    );
    
    console.log(`✅ Punto de estudio guardado con auditoría: ${point.name}`);
    return { success: true, id };
  } catch (error) {
    console.error('Error al guardar punto de estudio:', error);
    return { success: false, error: 'Error al guardar en la base de datos' };
  }
};

// 🔥 Actualizar punto de estudio (EDITAR)
export const updateStudyPoint = async (id: string, updates: Partial<StudyPoint>): Promise<{ success: boolean; error?: string }> => {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, error: 'Usuario no autenticado' };
  
  try {
    // Obtener estado anterior para auditoría
    const oldPoint = await getStudyPointById(id);
    if (!oldPoint) return { success: false, error: 'Punto de estudio no encontrado' };
    
    const database = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    const changes: string[] = [];
    
    if (updates.name !== undefined && updates.name !== oldPoint.name) {
      fields.push('name = ?');
      values.push(updates.name);
      changes.push(`Nombre: "${oldPoint.name}" → "${updates.name}"`);
    }
    if (updates.notes !== undefined && updates.notes !== oldPoint.notes) {
      fields.push('notes = ?');
      values.push(updates.notes);
      changes.push('Notas actualizadas');
    }
    if (updates.latitude !== undefined && updates.latitude !== oldPoint.latitude) {
      fields.push('latitude = ?');
      values.push(updates.latitude);
      changes.push(`Latitud: ${oldPoint.latitude} → ${updates.latitude}`);
    }
    if (updates.longitude !== undefined && updates.longitude !== oldPoint.longitude) {
      fields.push('longitude = ?');
      values.push(updates.longitude);
      changes.push(`Longitud: ${oldPoint.longitude} → ${updates.longitude}`);
    }
    if (updates.category !== undefined && updates.category !== oldPoint.category) {
      fields.push('category = ?');
      values.push(updates.category);
      changes.push(`Categoría: "${oldPoint.category || 'Sin categoría'}" → "${updates.category}"`);
    }
    if (updates.rating !== undefined && updates.rating !== oldPoint.rating) {
      fields.push('rating = ?');
      values.push(updates.rating);
      const stars = '⭐'.repeat(updates.rating);
      changes.push(`Calificación: ${oldPoint.rating || 0} → ${updates.rating} ${stars}`);
    }
    
    if (fields.length === 0) {
      return { success: true }; // No hay cambios
    }
    
    values.push(id);
    values.push(userId);
    
    await database.runAsync(
      `UPDATE study_points SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );
    
    // ✅ AUDITORÍA: Actualización de punto de estudio
    await logAudit(
      'UPDATE_STUDY_POINT', // 🔥 Nuevo tipo de acción
      id,
      oldPoint.name,
      changes.join('; '),
      {
        previous: {
          name: oldPoint.name,
          latitude: oldPoint.latitude,
          longitude: oldPoint.longitude,
          category: oldPoint.category,
          rating: oldPoint.rating,
          notes: oldPoint.notes
        }
      },
      {
        new: {
          name: updates.name || oldPoint.name,
          latitude: updates.latitude || oldPoint.latitude,
          longitude: updates.longitude || oldPoint.longitude,
          category: updates.category !== undefined ? updates.category : oldPoint.category,
          rating: updates.rating !== undefined ? updates.rating : oldPoint.rating
        }
      }
    );
    
    console.log(`✅ Punto de estudio actualizado con auditoría: ${oldPoint.name}`);
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar punto de estudio:', error);
    return { success: false, error: 'Error al actualizar en la base de datos' };
  }
};

// 🔥 Eliminar punto de estudio
export const deleteStudyPoint = async (id: string): Promise<{ success: boolean; error?: string }> => {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, error: 'Usuario no autenticado' };
  
  try {
    // Obtener el punto antes de eliminarlo para auditoría
    const pointToDelete = await getStudyPointById(id);
    if (!pointToDelete) return { success: false, error: 'Punto de estudio no encontrado' };
    
    const database = getDatabase();
    await database.runAsync(
      'DELETE FROM study_points WHERE id = ? AND userId = ?',
      [id, userId]
    );
    
    // ✅ AUDITORÍA: Eliminación de punto de estudio
    await logAudit(
      'DELETE_STUDY_POINT', // 🔥 Nuevo tipo de acción
      id,
      pointToDelete.name,
      `Punto de estudio eliminado en coordenadas (${pointToDelete.latitude}, ${pointToDelete.longitude})`,
      {
        name: pointToDelete.name,
        latitude: pointToDelete.latitude,
        longitude: pointToDelete.longitude,
        category: pointToDelete.category,
        notes: pointToDelete.notes
      },
      null
    );
    
    console.log(`🗑️ Punto de estudio eliminado con auditoría: ${pointToDelete.name}`);
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar punto de estudio:', error);
    return { success: false, error: 'Error al eliminar de la base de datos' };
  }
};

// 🔥 Obtener puntos por categoría
export const getStudyPointsByCategory = async (category: string): Promise<StudyPoint[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  try {
    const database = getDatabase();
    const result = await database.getAllAsync(
      'SELECT * FROM study_points WHERE userId = ? AND category = ? ORDER BY rating DESC',
      [userId, category]
    );
    return result as StudyPoint[];
  } catch (error) {
    console.error('Error al obtener puntos por categoría:', error);
    return [];
  }
};

// 🔥 Obtener puntos cercanos (radio en km)
export const getNearbyStudyPoints = async (latitude: number, longitude: number, radiusKm: number = 5): Promise<StudyPoint[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  try {
    const database = getDatabase();
    const points = await getStudyPoints();
    
    // Calcular distancia usando fórmula de Haversine
    const R = 6371; // Radio de la Tierra en km
    return points.filter(point => {
      const dLat = (point.latitude - latitude) * Math.PI / 180;
      const dLon = (point.longitude - longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(latitude * Math.PI / 180) * Math.cos(point.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      return distance <= radiusKm;
    });
  } catch (error) {
    console.error('Error al obtener puntos cercanos:', error);
    return [];
  }
};

// 🔥 Función para sincronizar puntos de estudio (útil para importar/exportar)
export const syncStudyPoints = async (points: StudyPoint[]): Promise<{ success: boolean; added: number; updated: number; error?: string }> => {
  const userId = getCurrentUserId();
  if (!userId) return { success: false, added: 0, updated: 0, error: 'Usuario no autenticado' };
  
  let added = 0;
  let updated = 0;
  
  try {
    for (const point of points) {
      const existing = await getStudyPointById(point.id);
      if (existing) {
        // Actualizar existente
        await updateStudyPoint(point.id, point);
        updated++;
      } else {
        // Crear nuevo
        await saveStudyPoint({
          name: point.name,
          latitude: point.latitude,
          longitude: point.longitude,
          notes: point.notes,
          category: point.category,
          rating: point.rating
        });
        added++;
      }
    }
    
    await logAudit(
      'IMPORT_STUDY_POINTS',
      'batch',
      'Importación masiva',
      `Importados ${added} nuevos, actualizados ${updated} puntos de estudio`,
      null,
      { added, updated, total: points.length }
    );
    
    return { success: true, added, updated };
  } catch (error) {
    console.error('Error al sincronizar puntos:', error);
    return { success: false, added, updated, error: 'Error durante la sincronización' };
  }
};