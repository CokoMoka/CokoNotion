// services/auditLogger.ts
import { File, Directory, Paths } from 'expo-file-system';
import { getCurrentUser } from './auth';

export type AuditAction = 
  | 'CREATE_NOTE'
  | 'UPDATE_NOTE'
  | 'DELETE_NOTE'
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'COMPLETE_TASK'
  | 'UNCOMPLETE_TASK'
  | 'TOGGLE_IMPORTANT'
   // Imágenes
  | 'UPDATE_AVATAR'
  | 'DELETE_AVATAR'
  | 'UPDATE_BANNER'
  | 'DELETE_BANNER'
  | 'UPDATE_BACKGROUND'
  | 'DELETE_BACKGROUND'
  | 'UPDATE_COVER'
  | 'DELETE_COVER'
   // Flashcards - Sets
  | 'CREATE_FLASHCARD_SET'
  | 'UPDATE_FLASHCARD_SET'
  | 'DELETE_FLASHCARD_SET'
  | 'UPDATE_FLASHCARD_COVER'
  | 'DELETE_FLASHCARD_COVER'
  | 'EXPORT_FLASHCARD_SET'
  | 'IMPORT_FLASHCARD_SET'
  // Flashcards - Tarjetas
  | 'ADD_CARD_TO_SET'
  | 'EDIT_CARD_IN_SET'
  | 'DELETE_CARD_FROM_SET'
  | 'MASTER_CARD'
  | 'UNMASTER_CARD'
   // USUARIO
  | 'UPDATE_PROFILE_NAME'
  | 'UPDATE_PROFILE_EMAIL'
  | 'UPDATE_PROFILE_PREFERENCES'
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_REGISTER'
  | 'DELETE_ACCOUNT'
    // PUNTOS DE ESTUDIO
    | 'CREATE_STUDY_POINT'
  | 'UPDATE_STUDY_POINT'
  | 'DELETE_STUDY_POINT'
  | 'IMPORT_STUDY_POINTS'
  | 'EXPORT_STUDY_POINTS'
   //  POMODOROS
 | 'POMODORO_COMPLETED'
  | 'BREAK_COMPLETED';



export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: AuditAction;
  noteId: string;
  noteTitle: string;
  details: string;
  previousState?: any;
  newState?: any;
}

let auditDirectory: Directory | null = null;

const getAuditDirectory = async (): Promise<Directory> => {
  if (auditDirectory) return auditDirectory;
  
  const auditDir = new Directory(Paths.document, 'audit');
  if (!auditDir.exists) {
    auditDir.create({ intermediates: true });
    console.log('📁 Directorio de auditoría creado');
  }
  
  auditDirectory = auditDir;
  return auditDirectory;
};

const getTodayAuditFile = async (): Promise<File> => {
  const today = new Date().toISOString().split('T')[0];
  const dir = await getAuditDirectory();
  return new File(dir, `audit_${today}.txt`);
};

export const logAudit = async (
  action: AuditAction,
  noteId: string,
  noteTitle: string,
  details: string,
  previousState?: any,
  newState?: any
): Promise<void> => {
  try {
    const user = getCurrentUser();
    if (!user) {
      console.log('⚠️ No hay usuario autenticado');
      return;
    }

    const entry: AuditEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      userId: user.uid,
      action,
      noteId,
      noteTitle,
      details,
    };

    // 🔥 FORMATO MÁS FÁCIL DE PARSEAR (JSON en cada línea)
    const logLine = JSON.stringify({
      timestamp: entry.timestamp,
      action: entry.action,
      noteId: entry.noteId,
      noteTitle: entry.noteTitle,
      details: entry.details,
    });
    
    const file = await getTodayAuditFile();
    
    let existingContent = '';
    if (file.exists) {
      existingContent = await file.text();
    }
    
    const newContent = logLine + '\n' + existingContent;
    await file.write(newContent);
    
    console.log(`✅ Audit logged: ${action} - ${noteTitle}`);
  } catch (error) {
    console.error('❌ Error al guardar auditoría:', error);
  }
};

// 🔥 NUEVO PARSEO (basado en JSON)
export const getAllAuditEntries = async (): Promise<AuditEntry[]> => {
  try {
    const user = getCurrentUser();
    if (!user) return [];

    const dir = await getAuditDirectory();
    const files = dir.list();
    const auditFiles = files.filter(file => 
      file.name.startsWith('audit_') && file.name.endsWith('.txt')
    );
    
    let allEntries: AuditEntry[] = [];
    
    for (const file of auditFiles) {
      const content = await file.text();
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        try {
          // 🔥 Parsear JSON
          const parsed = JSON.parse(line);
          allEntries.push({
            id: `${parsed.timestamp}_${parsed.noteId}`,
            timestamp: parsed.timestamp,
            userId: user.uid,
            action: parsed.action,
            noteId: parsed.noteId,
            noteTitle: parsed.noteTitle,
            details: parsed.details,
          });
        } catch (parseError) {
          // Si no es JSON, ignorar la línea
          console.log('⚠️ Línea no parseable:', line.substring(0, 50));
        }
      }
    }
    
    allEntries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    console.log(`✅ Total de entradas: ${allEntries.length}`);
    
    return allEntries;
  } catch (error) {
    console.error('Error al obtener auditoría:', error);
    return [];
  }
};

// Exportar auditoría a archivo .txt completo (formato legible)
export const exportFullAudit = async (): Promise<string | null> => {
  try {
    const user = getCurrentUser();
    if (!user) return null;
    
    const entries = await getAllAuditEntries();
    if (entries.length === 0) return null;
    
    const exportFileName = `audit_export_${user.uid}_${Date.now()}.txt`;
    const exportFile = new File(Paths.document, exportFileName);
    
    let content = `========================================\n`;
    content += `📋 REGISTRO DE AUDITORÍA\n`;
    content += `========================================\n`;
    content += `Usuario: ${user.email}\n`;
    content += `Exportado: ${new Date().toLocaleString('es-MX')}\n`;
    content += `Total de registros: ${entries.length}\n`;
    content += `========================================\n\n`;
    
    const actionNames: Record<string, string> = {
      'CREATE_NOTE': '📝 Crear Nota',
      'UPDATE_NOTE': '✏️ Editar Nota',
      'DELETE_NOTE': '🗑️ Eliminar Nota',
      'CREATE_TASK': '✅ Crear Tarea',
      'UPDATE_TASK': '📋 Editar Tarea',
      'DELETE_TASK': '❌ Eliminar Tarea',
      'COMPLETE_TASK': '✔️ Completar Tarea',
      'UNCOMPLETE_TASK': '🔄 Desmarcar Tarea',
      'TOGGLE_IMPORTANT': '⭐ Marcar Importante',
        'UPDATE_AVATAR': '👤',
  'DELETE_AVATAR': '👤❌',
  'UPDATE_BANNER': '🎨',
  'DELETE_BANNER': '🎨❌',
  'UPDATE_BACKGROUND': '🖼️',
  'DELETE_BACKGROUND': '🖼️❌',
  'UPDATE_COVER': '📚',
  'DELETE_COVER': '📚❌',
     // Sets
  'CREATE_FLASHCARD_SET': '🃏',
  'UPDATE_FLASHCARD_SET': '✏️🃏',
  'DELETE_FLASHCARD_SET': '🗑️🃏',
  'UPDATE_FLASHCARD_COVER': '🎴',
  'DELETE_FLASHCARD_COVER': '🎴❌',
  'EXPORT_FLASHCARD_SET': '📤🃏',
  'IMPORT_FLASHCARD_SET': '📥🃏',
  // Tarjetas
  'ADD_CARD_TO_SET': '➕🃏',
  'EDIT_CARD_IN_SET': '✏️📇',
  'DELETE_CARD_FROM_SET': '🗑️📇',
  'MASTER_CARD': '⭐🃏',
  'UNMASTER_CARD': '🔄🃏',
  // Usuario
  'UPDATE_PROFILE_NAME': '✏️👤',
  'UPDATE_PROFILE_EMAIL': '📧👤',
  'UPDATE_PROFILE_PREFERENCES': '⚙️👤',
  'USER_LOGIN': '🔓',
  'USER_LOGOUT': '🔒',
  'USER_REGISTER': '📝👤',
  'DELETE_ACCOUNT': '🗑️👤',
   //  PUNTOS DE ESTUDIO
  'CREATE_STUDY_POINT': '📍 Crear Punto Estudio',
  'UPDATE_STUDY_POINT': '✏️📍 Editar Punto Estudio',
  'DELETE_STUDY_POINT': '🗑️📍 Eliminar Punto Estudio',
  'IMPORT_STUDY_POINTS': '📥📍 Importar Puntos',
  'EXPORT_STUDY_POINTS': '📤📍 Exportar Puntos',
  //  POMODOROS
  'POMODORO_COMPLETED': '🍅 Pomodoro Completado',
  'BREAK_COMPLETED': '☕ Descanso Completado',
};
    
    for (const entry of entries) {
      const date = new Date(entry.timestamp);
      const formattedDate = date.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      
      content += `[${formattedDate}] ${actionNames[entry.action] || entry.action}\n`;
      content += `  ├─ ID: ${entry.noteId}\n`;
      content += `  ├─ Título: ${entry.noteTitle}\n`;
      content += `  └─ Detalle: ${entry.details}\n`;
      content += `\n`;
    }
    
    content += `========================================\n`;
    content += `Fin del registro\n`;
    
    await exportFile.write(content);
    console.log(`✅ Auditoría exportada a: ${exportFile.uri}`);
    
    return exportFile.uri;
  } catch (error) {
    console.error('Error al exportar auditoría:', error);
    return null;
  }
};

// Limpiar auditorías antiguas
export const cleanOldAuditFiles = async (): Promise<void> => {
  try {
    const dir = await getAuditDirectory();
    const files = dir.list();
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      if (file.name.startsWith('audit_')) {
        const dateMatch = file.name.match(/audit_(\d{4}-\d{2}-\d{2})\.txt/);
        if (dateMatch) {
          const fileDate = new Date(dateMatch[1]).getTime();
          if (fileDate < thirtyDaysAgo) {
            file.delete();
            console.log(`🗑️ Archivo antiguo eliminado: ${file.name}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error al limpiar auditorías:', error);
  }
};