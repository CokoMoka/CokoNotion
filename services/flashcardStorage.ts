// services/flashcardStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { logAudit } from './auditLogger';
import { getCurrentUser } from './auth';

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
  coverBase64?: string;
  coverSizeKB?: number;
}

const FLASHCARDS_DIR = `${FileSystem.documentDirectory}flashcards/`;

export const ensureDirectory = async () => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(FLASHCARDS_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
    }
  } catch (error) {
    console.log('Error al verificar/crear directorio:', error);
    await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
  }
};

export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 200, height: 200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    
    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('Error al convertir imagen a Base64:', error);
    throw error;
  }
};

export const pickCoverImage = async (): Promise<string | null> => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Se necesita permiso para acceder a la galería');
      return null;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      return result.assets[0].uri;
    }
    return null;
  } catch (error) {
    console.error('Error al seleccionar imagen:', error);
    return null;
  }
};

const getBase64Size = (base64: string): number => {
  const base64Data = base64.split(',')[1] || base64;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024;
};

// ========== FUNCIONES BASE ==========

export const saveFlashcardSet = async (set: FlashcardSet): Promise<boolean> => {
  try {
    await ensureDirectory();
    
    let content = `${set.name}\n---\n`;
    content += `${set.coverBase64 || ''}\n---\n`;
    
    for (const card of set.cards) {
      const masteredValue = card.mastered ? '1' : '0';
      content += `${card.front}|${card.back}|${masteredValue}\n`;
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

export const loadFlashcardSet = async (id: string): Promise<FlashcardSet | null> => {
  try {
    const filePath = `${FLASHCARDS_DIR}${id}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (!fileInfo.exists) return null;
    
    const content = await FileSystem.readAsStringAsync(filePath);
    const lines = content.split('\n');
    const name = lines[0];
    
    let coverBase64: string | undefined;
    let startIndex = 2;
    
    if (lines[1] === '---' && lines[2] === '---') {
      startIndex = 3;
    } else if (lines[1] === '---') {
      const coverData = lines[2];
      if (coverData && coverData.startsWith('data:image/')) {
        coverBase64 = coverData;
      }
      startIndex = 4;
    }
    
    const cards: Flashcard[] = [];
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line === '') continue;
      
      const parts = line.split('|');
      if (parts.length >= 2) {
        const contentHash = `${parts[0]}_${parts[1]}`.replace(/[^a-zA-Z0-9]/g, '_');
        const consistentId = `card_${id}_${contentHash.substring(0, 20)}`;
        
        cards.push({
          id: consistentId,
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
      coverBase64,
    };
  } catch (error) {
    console.error('Error al cargar set:', error);
    return null;
  }
};

export const deleteFlashcardSet = async (id: string): Promise<boolean> => {
  try {
    const set = await loadFlashcardSet(id);
    if (!set) return false;
    
    const filePath = `${FLASHCARDS_DIR}${id}.txt`;
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(filePath);
    }
    
    await logAudit(
      'DELETE_FLASHCARD_SET',
      id,
      set.name,
      `Set eliminado con ${set.cards.length} tarjetas`
    );
    
    return true;
  } catch (error) {
    console.error('Error al eliminar set:', error);
    return false;
  }
};

export const updateCardProgress = async (setId: string, cardId: string, mastered: boolean): Promise<boolean> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    const cardIndex = set.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    const wasMastered = set.cards[cardIndex].mastered;
    set.cards[cardIndex].mastered = mastered;
    set.lastStudied = new Date().toISOString();
    
    const success = await saveFlashcardSet(set);
    
    if (success && wasMastered !== mastered) {
      await logAudit(
        mastered ? 'MASTER_CARD' : 'UNMASTER_CARD',
        cardId,
        set.cards[cardIndex].front.substring(0, 30),
        mastered ? `Tarjeta dominada en set "${set.name}"` : `Tarjeta marcada como no dominada en set "${set.name}"`
      );
    }
    
    return success;
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    return false;
  }
};

// ========== 🔥 FUNCIONES CON AUDITORÍA PARA CRUD ==========

export const createFlashcardSet = async (name: string, cards: Flashcard[] = []): Promise<FlashcardSet | null> => {
  console.log('🔍 [flashcardStorage] createFlashcardSet llamado:', { name, cardsCount: cards.length });
  
  try {
    const newSet: FlashcardSet = {
      id: Date.now().toString(),
      name,
      cards,
      createdAt: new Date().toISOString(),
    };
    
    const success = await saveFlashcardSet(newSet);
    
    if (success) {
      console.log('✅ Set guardado, registrando auditoría...');
      await logAudit(
        'CREATE_FLASHCARD_SET',
        newSet.id,
        name,
        `Set creado con ${cards.length} tarjetas`
      );
      console.log('✅ Auditoría registrada para CREATE_FLASHCARD_SET');
      return newSet;
    }
    console.log('❌ Error al guardar set');
    return null;
  } catch (error) {
    console.error('❌ Error en createFlashcardSet:', error);
    return null;
  }
};

export const updateFlashcardSet = async (setId: string, updates: Partial<FlashcardSet>): Promise<boolean> => {
  console.log('🔍 [flashcardStorage] updateFlashcardSet llamado:', { setId, updates });
  
  try {
    const oldSet = await loadFlashcardSet(setId);
    if (!oldSet) {
      console.log('❌ Set no encontrado:', setId);
      return false;
    }
    
    console.log('📊 Set original:', { name: oldSet.name, cardsCount: oldSet.cards.length });
    
    const updatedSet = { ...oldSet, ...updates };
    const success = await saveFlashcardSet(updatedSet);
    
    if (success) {
      const changes: string[] = [];
      if (updates.name !== undefined && updates.name !== oldSet.name) {
        changes.push(`Nombre: "${oldSet.name}" → "${updates.name}"`);
      }
      if (updates.cards !== undefined && updates.cards.length !== oldSet.cards.length) {
        changes.push(`Tarjetas: ${oldSet.cards.length} → ${updates.cards.length}`);
      } else if (updates.cards !== undefined) {
        changes.push(`Contenido de tarjetas actualizado`);
      }
      
      if (changes.length > 0) {
        console.log('✅ Set actualizado, registrando auditoría...');
        await logAudit(
          'UPDATE_FLASHCARD_SET',
          setId,
          updatedSet.name,
          changes.join('; ')
        );
        console.log('✅ Auditoría registrada para UPDATE_FLASHCARD_SET');
      } else {
        console.log('ℹ️ Sin cambios significativos');
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error en updateFlashcardSet:', error);
    return false;
  }
};

export const addCardToSet = async (setId: string, front: string, back: string): Promise<boolean> => {
  console.log('🔍 addCardToSet llamado:', { setId, front, back });
  
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    const newCard: Flashcard = {
      id: `card_${Date.now()}_${set.cards.length}`,
      front,
      back,
      mastered: false,
    };
    
    set.cards.push(newCard);
    const success = await saveFlashcardSet(set);
    
    if (success) {
      await logAudit(
        'ADD_CARD_TO_SET',
        setId,
        set.name,
        `Tarjeta añadida: "${front.substring(0, 30)}"`
      );
    }
    
    return success;
  } catch (error) {
    console.error('Error al añadir tarjeta:', error);
    return false;
  }
};

export const editCardInSet = async (setId: string, cardId: string, front: string, back: string): Promise<boolean> => {
  console.log('🔍 editCardInSet llamado:', { setId, cardId, front, back });
  
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    const cardIndex = set.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    const oldFront = set.cards[cardIndex].front;
    set.cards[cardIndex].front = front;
    set.cards[cardIndex].back = back;
    
    const success = await saveFlashcardSet(set);
    
    if (success) {
      await logAudit(
        'EDIT_CARD_IN_SET',
        cardId,
        set.name,
        `Tarjeta editada: "${oldFront.substring(0, 30)}" → "${front.substring(0, 30)}"`
      );
    }
    
    return success;
  } catch (error) {
    console.error('Error al editar tarjeta:', error);
    return false;
  }
};

export const deleteCardFromSet = async (setId: string, cardId: string): Promise<boolean> => {
  console.log('🔍 deleteCardFromSet llamado:', { setId, cardId });
  
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    const cardIndex = set.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;
    
    const deletedCard = set.cards[cardIndex];
    set.cards.splice(cardIndex, 1);
    
    const success = await saveFlashcardSet(set);
    
    if (success) {
      await logAudit(
        'DELETE_CARD_FROM_SET',
        cardId,
        set.name,
        `Tarjeta eliminada: "${deletedCard.front.substring(0, 30)}"`
      );
    }
    
    return success;
  } catch (error) {
    console.error('Error al eliminar tarjeta:', error);
    return false;
  }
};

export const updateSetCover = async (setId: string, imageUri: string): Promise<boolean> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    const base64 = await imageToBase64(imageUri);
    const sizeKB = getBase64Size(base64);
    
    set.coverBase64 = base64;
    set.coverSizeKB = sizeKB;
    
    const success = await saveFlashcardSet(set);
    
    if (success) {
      await logAudit(
        'UPDATE_FLASHCARD_COVER',
        setId,
        set.name,
        `Portada actualizada (${sizeKB.toFixed(1)}KB)`
      );
    }
    
    return success;
  } catch (error) {
    console.error('Error al actualizar portada:', error);
    return false;
  }
};

export const deleteSetCover = async (setId: string): Promise<boolean> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    set.coverBase64 = undefined;
    set.coverSizeKB = undefined;
    
    const success = await saveFlashcardSet(set);
    
    if (success) {
      await logAudit(
        'DELETE_FLASHCARD_COVER',
        setId,
        set.name,
        `Portada eliminada`
      );
    }
    
    return success;
  } catch (error) {
    console.error('Error al eliminar portada:', error);
    return false;
  }
};

export const exportFlashcardSet = async (setId: string): Promise<string | null> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return null;
    
    let content = `=== ${set.name} ===\n\n`;
    content += `Total de tarjetas: ${set.cards.length}\n`;
    content += `Dominadas: ${set.cards.filter(c => c.mastered).length}\n`;
    content += `Pendientes: ${set.cards.filter(c => !c.mastered).length}\n\n`;
    
    if (set.coverBase64) {
      content += `--- PORTADA (Base64) ---\n`;
      content += `${set.coverBase64}\n\n`;
    }
    
    content += `--- TARJETAS ---\n\n`;
    
    for (const card of set.cards) {
      content += `❓ ${card.front}\n`;
      content += `✅ ${card.back}\n`;
      content += `${card.mastered ? '✓ Dominada' : '○ Pendiente'}\n`;
      content += `${'-'.repeat(40)}\n\n`;
    }
    
    const exportPath = `${FileSystem.documentDirectory}export_${setId}.txt`;
    await FileSystem.writeAsStringAsync(exportPath, content);
    
    await logAudit(
      'EXPORT_FLASHCARD_SET',
      setId,
      set.name,
      `Set exportado con ${set.cards.length} tarjetas`
    );
    
    return exportPath;
  } catch (error) {
    console.error('Error al exportar set:', error);
    return null;
  }
};

export const importFlashcardSet = async (fileUri: string): Promise<FlashcardSet | null> => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');
    
    let name = `Set_${Date.now()}`;
    let coverBase64: string | undefined;
    let cards: Flashcard[] = [];
    let currentCard: { front?: string; back?: string } = {};
    let readingCover = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '--- PORTADA (Base64) ---') {
        readingCover = true;
        continue;
      }
      
      if (readingCover && trimmedLine.startsWith('data:image/')) {
        coverBase64 = trimmedLine;
        readingCover = false;
        continue;
      }
      
      if (trimmedLine.startsWith('❓')) {
        currentCard.front = trimmedLine.substring(2).trim();
      } else if (trimmedLine.startsWith('✅') && currentCard.front) {
        currentCard.back = trimmedLine.substring(2).trim();
        cards.push({
          id: `card_${Date.now()}_${cards.length}`,
          front: currentCard.front,
          back: currentCard.back,
          mastered: false,
        });
        currentCard = {};
      } else if (trimmedLine.startsWith('===') && cards.length === 0) {
        const match = trimmedLine.match(/=== (.*) ===/);
        if (match) name = match[1];
      }
    }
    
    if (cards.length === 0) return null;
    
    const newSet: FlashcardSet = {
      id: Date.now().toString(),
      name,
      cards,
      createdAt: new Date().toISOString(),
      coverBase64,
    };
    
    await saveFlashcardSet(newSet);
    
    await logAudit(
      'IMPORT_FLASHCARD_SET',
      newSet.id,
      name,
      `Set importado con ${cards.length} tarjetas`
    );
    
    return newSet;
  } catch (error) {
    console.error('Error al importar set:', error);
    return null;
  }
};