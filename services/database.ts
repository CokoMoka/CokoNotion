import { getCurrentUser } from './auth'; 
import * as SQLite from 'expo-sqlite';

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

let database: SQLite.SQLiteDatabase | null = null;

const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    database = SQLite.openDatabaseSync('notes.db');
  }
  return database;
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

// ✅ Obtener el usuario actual
const getCurrentUserId = (): string | null => {
  const user = getCurrentUser();
  return user?.uid || null;
};

// ✅ Obtener todas las notas del usuario actual
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

// ✅ Obtener notas por tipo del usuario actual
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

// ✅ Obtener una nota por ID (verificando que pertenezca al usuario)
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

// ✅ Guardar una nueva nota (con userId)
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

// ✅ Actualizar una nota (verificando que pertenezca al usuario)
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

// ✅ Eliminar una nota (verificando que pertenezca al usuario)
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