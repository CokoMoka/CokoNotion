import { getCurrentUser } from './auth'; 
import * as SQLite from 'expo-sqlite';

//interfaz a usar para la gente cool que se hace notar
export interface Note {
  id: string;
  userId: string;     
  title: string;
  content: string;
  type: 'nota' | 'tarea';
  date: string;
  isImportant: boolean;
  tasks?: string[];
}
//interfaz para sqlite 
interface NoteRow {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'nota' | 'tarea';
  date: string;
  isImportant: number;
  tasks: string | null;
}
//obtener bd
let database: SQLite.SQLiteDatabase | null = null;
const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    database = SQLite.openDatabaseSync('notes.db');
  }
  return database;
};
//convertir notasrow a notas
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
  };
};

//inicializacion
export const initDatabase = async (): Promise<void> => {
  try {
    const database = getDatabase();
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT NOT NULL,
        date TEXT NOT NULL,
        isImportant INTEGER DEFAULT 0,
        tasks TEXT
      );
    `);
    console.log('!!!!! Base de datos inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar DB:', error);
    throw error;
  }
};

// obtener el usuario actual
const getCurrentUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.uid || null;
};

// obtener todas las notas del usuario actual
export const getAllNotes = async (): Promise<Note[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
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

// obtener notas por TIPO nota o trea
export const getNotesByType = async (type: 'nota' | 'tarea'): Promise<Note[]> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return [];
    
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

// Obtener n0ta por ID
export const getNoteById = async (id: string): Promise<Note | null> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return null;
    
    const database = getDatabase();
    const result = await database.getFirstAsync(
      'SELECT * FROM notes WHERE id = ? AND userId = ?',
      [id, userId]
    );
    if (result) {
      const row = result as NoteRow;
      return mapRowToNote(row);
    }
    return null;
  } catch (error) {
    console.error('Error al obtener nota por ID:', error);
    return null;
  }
};

// guardar nota nueva
export const saveNote = async (note: Omit<Note, 'id' | 'userId'> & { id?: string }) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    
    const database = getDatabase();
    const id = note.id || Date.now().toString();
    const tasksJSON = note.tasks ? JSON.stringify(note.tasks) : null;
    
    await database.runAsync(
      `INSERT OR REPLACE INTO notes (id, userId, title, content, type, date, isImportant, tasks) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, note.title, note.content || '', note.type, note.date, note.isImportant ? 1 : 0, tasksJSON]
    );
    return { success: true, id };
  } catch (error) {
    console.error('Error al guardar nota:', error);
    return { success: false, error };
  }
};

// actualizar nota
export const updateNote = async (id: string, updates: Partial<Note>) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Usuario no autenticado' };
    
    // Verificar que la nota pertenece al usuario
    const existingNote = await getNoteById(id);
    if (!existingNote) {
      return { success: false, error: 'Nota no encontrada' };
    }
    
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
//eliminar nota
export const deleteNote = async (id: string) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) return { success: false, error: 'Usuario no autenticado' };
    
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

//==============================MAPAS

// services/database.ts

export interface StudyPoint {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  notes?: string;
}

// Inicializar tabla de puntos de estudio
export const initStudyPointsTable = async () => {
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
};

// Obtener puntos de estudio del usuario
export const getStudyPoints = async (): Promise<StudyPoint[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  const database = getDatabase();
  const result = await database.getAllAsync(
    'SELECT * FROM study_points WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
  return result as StudyPoint[];
};

// Guardar punto de estudio
export const saveStudyPoint = async (point: Omit<StudyPoint, 'id' | 'userId' | 'createdAt'>): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  const database = getDatabase();
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  
  await database.runAsync(
    `INSERT INTO study_points (id, userId, name, latitude, longitude, createdAt, notes) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, point.name, point.latitude, point.longitude, createdAt, point.notes || null]
  );
  return true;
};

// Eliminar punto de estudio
export const deleteStudyPoint = async (id: string): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
  const database = getDatabase();
  await database.runAsync('DELETE FROM study_points WHERE id = ? AND userId = ?', [id, userId]);
  return true;
};

// Actualizar punto de estudio
export const updateStudyPoint = async (id: string, updates: Partial<StudyPoint>): Promise<boolean> => {
  const userId = getCurrentUserId();
  if (!userId) return false;
  
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
};