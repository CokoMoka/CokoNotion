// services/flashcardStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

export interface FlashcardSet {
  id: string;
  name: string;
  cards: Flashcard[];
  createdAt: string;
  lastStudied?: string;
}

// Directorio para los sets de flashcards
const FLASHCARDS_DIR = `${FileSystem.documentDirectory}flashcards/`;

// Asegurar que el directorio existe
export const ensureDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(FLASHCARDS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.log('Error al verificar/crear directorio:', error);
    // Intentar crear directamente
    await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
  }
};

// Guardar un set de flashcards
export const saveFlashcardSet = async (set: FlashcardSet): Promise<boolean> => {
  try {
    await ensureDirectory();
    
    // Formato: NOMBRE\n---\nFRONT|BACK|MASTERED\n...
    let content = `${set.name}\n---\n`;
    
    for (const card of set.cards) {
      content += `${card.front}|${card.back}|${card.mastered ? '1' : '0'}\n`;
    }
    
    const filePath = `${FLASHCARDS_DIR}${set.id}.txt`;
    await FileSystem.writeAsStringAsync(filePath, content);
    console.log('✅ Set guardado en:', filePath);
    return true;
  } catch (error) {
    console.error('Error al guardar set:', error);
    return false;
  }
};

// Cargar todos los sets
export const loadAllFlashcardSets = async (): Promise<FlashcardSet[]> => {
  try {
    await ensureDirectory();
    
    const files = await FileSystem.readDirectoryAsync(FLASHCARDS_DIR);
    const sets: FlashcardSet[] = [];
    
    for (const file of files) {
      if (file.endsWith('.txt')) {
        const set = await loadFlashcardSet(file.replace('.txt', ''));
        if (set) sets.push(set);
      }
    }
    
    return sets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error('Error al cargar sets:', error);
    return [];
  }
};

// Cargar un set específico
export const loadFlashcardSet = async (id: string): Promise<FlashcardSet | null> => {
  try {
    const filePath = `${FLASHCARDS_DIR}${id}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) {
      console.log('Archivo no existe:', filePath);
      return null;
    }
    
    const content = await FileSystem.readAsStringAsync(filePath);
    const lines = content.split('\n');
    const name = lines[0];
    const cards: Flashcard[] = [];
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      const parts = line.split('|');
      if (parts.length >= 2) {
        cards.push({
          id: `card_${Date.now()}_${i}`,
          front: parts[0],
          back: parts[1],
          mastered: parts[2] === '1',
        });
      }
    }
    
    return {
      id,
      name,
      cards,
      createdAt: fileInfo.modificationTime ? new Date(fileInfo.modificationTime).toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error al cargar set:', error);
    return null;
  }
};

// Eliminar un set
export const deleteFlashcardSet = async (id: string): Promise<boolean> => {
  try {
    const filePath = `${FLASHCARDS_DIR}${id}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
    return true;
  } catch (error) {
    console.error('Error al eliminar set:', error);
    return false;
  }
};

// Actualizar progreso de una tarjeta
export const updateCardProgress = async (setId: string, cardId: string, mastered: boolean): Promise<boolean> => {
  const set = await loadFlashcardSet(setId);
  if (!set) return false;
  
  const cardIndex = set.cards.findIndex(c => c.id === cardId);
  if (cardIndex === -1) return false;
  
  set.cards[cardIndex].mastered = mastered;
  set.lastStudied = new Date().toISOString();
  
  return await saveFlashcardSet(set);
};

// Exportar set como archivo de texto para compartir
export const exportFlashcardSet = async (setId: string): Promise<string | null> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return null;
    
    let content = `=== ${set.name} ===\n\n`;
    content += `Total de tarjetas: ${set.cards.length}\n`;
    content += `Dominadas: ${set.cards.filter(c => c.mastered).length}\n`;
    content += `Pendientes: ${set.cards.filter(c => !c.mastered).length}\n\n`;
    content += `--- TARJETAS ---\n\n`;
    
    for (const card of set.cards) {
      content += `❓ ${card.front}\n`;
      content += `✅ ${card.back}\n`;
      content += `${card.mastered ? '✓ Dominada' : '○ Pendiente'}\n`;
      content += `${'-'.repeat(40)}\n\n`;
    }
    
    const exportPath = `${FileSystem.documentDirectory}export_${setId}.txt`;
    await FileSystem.writeAsStringAsync(exportPath, content);
    
    return exportPath;
  } catch (error) {
    console.error('Error al exportar set:', error);
    return null;
  }
};

// Importar set desde archivo de texto
export const importFlashcardSet = async (fileUri: string): Promise<FlashcardSet | null> => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');
    
    let name = `Set_${Date.now()}`;
    let cards: Flashcard[] = [];
    let currentCard: { front?: string; back?: string } = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('❓')) {
        currentCard.front = line.substring(2).trim();
      } else if (line.startsWith('✅') && currentCard.front) {
        currentCard.back = line.substring(2).trim();
        cards.push({
          id: `card_${Date.now()}_${cards.length}`,
          front: currentCard.front,
          back: currentCard.back,
          mastered: false,
        });
        currentCard = {};
      } else if (line.startsWith('===') && cards.length === 0) {
        const match = line.match(/=== (.*) ===/);
        if (match) name = match[1];
      }
    }
    
    if (cards.length === 0) return null;
    
    const newSet: FlashcardSet = {
      id: Date.now().toString(),
      name,
      cards,
      createdAt: new Date().toISOString(),
    };
    
    await saveFlashcardSet(newSet);
    return newSet;
  } catch (error) {
    console.error('Error al importar set:', error);
    return null;
  }
};