// services/database.ts
import * as SQLite from 'expo-sqlite';
import { getCurrentUser } from './auth';

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
    
    try {
      await db.execAsync(`ALTER TABLE notes ADD COLUMN emoji TEXT;`);
      console.log('✅ Columna emoji añadida');
    } catch (e: any) {
      // La columna ya existe, ignorar
    }
    
    // Crear índice para mejorar rendimiento
    try {
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_notes_userId ON notes(userId);`);
      await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date DESC);`);
    } catch (indexError) {
      console.log('ℹ️ Índices ya existen o error:', indexError);
    }
    
    isInitialized = true;
    console.log('✅ Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('❌ Error en initDatabase:', error);
  }
};

// ========== OPERACIONES CRUD ==========

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
  if (!userId) {
    console.log('⚠️ No hay usuario autenticado, retornando array vacío');
    return [];
  }
  
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
    const database = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.isImportant !== undefined) {
      fields.push('isImportant = ?');
      values.push(updates.isImportant ? 1 : 0);
    }
    if (updates.tasks !== undefined) {
      fields.push('tasks = ?');
      values.push(JSON.stringify(updates.tasks));
    }
    if (updates.emoji !== undefined) {
      fields.push('emoji = ?');
      values.push(updates.emoji);
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
    const database = getDatabase();
    await database.runAsync(
      'DELETE FROM notes WHERE id = ? AND userId = ?',
      [id, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar nota:', error);
    return { success: false, error };
  }
};

// ========== PUNTOS DE ESTUDIO (MAPAS) ==========

export interface StudyPoint {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  notes?: string;
}

export const initStudyPointsTable = async () => {
  const userId = getCurrentUserId();
  if (!userId) {
    console.log('⚠️ No hay usuario autenticado, omitiendo inicialización de study_points');
    return;
  }
  
  try {
    const database = getDatabase();
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS study_points (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        createdAt TEXT NOT NULL,
        notes TEXT
      );
    `);
    console.log('✅ Tabla de puntos de estudio inicializada');
  } catch (error) {
    console.error('Error al inicializar study_points:', error);
  }
};

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

export const saveStudyPoint = async (point: Omit<StudyPoint, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  try {
    const database = getDatabase();
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    
    await database.runAsync(
      `INSERT INTO study_points (id, userId, name, latitude, longitude, createdAt, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, point.name, point.latitude, point.longitude, createdAt, point.notes || null]
    );
    return true;
  } catch (error) {
    console.error('Error al guardar punto de estudio:', error);
    return false;
  }
};

export const deleteStudyPoint = async (id: string): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  try {
    const database = getDatabase();
    await database.runAsync('DELETE FROM study_points WHERE id = ? AND userId = ?', [id, userId]);
    return true;
  } catch (error) {
    console.error('Error al eliminar punto de estudio:', error);
    return false;
  }
};

export const updateStudyPoint = async (id: string, updates: Partial<StudyPoint>): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  try {
    const database = getDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.notes !== undefined) {
      fields.push('notes = ?');
      values.push(updates.notes);
    }
    if (updates.latitude !== undefined) {
      fields.push('latitude = ?');
      values.push(updates.latitude);
    }
    if (updates.longitude !== undefined) {
      fields.push('longitude = ?');
      values.push(updates.longitude);
    }
    
    if (fields.length === 0) return true;
    
    values.push(id);
    values.push(userId);
    
    await database.runAsync(
      `UPDATE study_points SET ${fields.join(', ')} WHERE id = ? AND userId = ?`,
      values
    );
    return true;
  } catch (error) {
    console.error('Error al actualizar punto de estudio:', error);
    return false;
  }
};