// // services/flashcardStorage.ts
// import * as FileSystem from 'expo-file-system/legacy';
// import * as Sharing from 'expo-sharing';

// export interface Flashcard {
//   id: string;
//   front: string;
//   back: string;
//   mastered: boolean;
// }

// export interface FlashcardSet {
//   id: string;
//   name: string;
//   cards: Flashcard[];
//   createdAt: string;
//   lastStudied?: string;
// }

// // Directorio para los sets de flashcards
// const FLASHCARDS_DIR = `${FileSystem.documentDirectory}flashcards/`;

// // Asegurar que el directorio existe
// export const ensureDirectory = async () => {
//   try {
//     const dirInfo = await FileSystem.getInfoAsync(FLASHCARDS_DIR);
//     if (!dirInfo.exists) {
//       await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
//     }
//   } catch (error) {
//     console.log('Error al verificar/crear directorio:', error);
//     // Intentar crear directamente
//     await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
//   }
// };

// // Guardar un set de flashcards
// export const saveFlashcardSet = async (set: FlashcardSet): Promise<boolean> => {
//   try {
//     await ensureDirectory();
    
//     // Formato: NOMBRE\n---\nFRONT|BACK|MASTERED\n...
//     let content = `${set.name}\n---\n`;
    
//     for (const card of set.cards) {
//       content += `${card.front}|${card.back}|${card.mastered ? '1' : '0'}\n`;
//     }
    
//     const filePath = `${FLASHCARDS_DIR}${set.id}.txt`;
//     await FileSystem.writeAsStringAsync(filePath, content);
//     console.log('✅ Set guardado en:', filePath);
//     return true;
//   } catch (error) {
//     console.error('Error al guardar set:', error);
//     return false;
//   }
// };

// // Cargar todos los sets
// export const loadAllFlashcardSets = async (): Promise<FlashcardSet[]> => {
//   try {
//     await ensureDirectory();
    
//     const files = await FileSystem.readDirectoryAsync(FLASHCARDS_DIR);
//     const sets: FlashcardSet[] = [];
    
//     for (const file of files) {
//       if (file.endsWith('.txt')) {
//         const set = await loadFlashcardSet(file.replace('.txt', ''));
//         if (set) sets.push(set);
//       }
//     }
    
//     return sets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
//   } catch (error) {
//     console.error('Error al cargar sets:', error);
//     return [];
//   }
// };

// // Cargar un set específico
// export const loadFlashcardSet = async (id: string): Promise<FlashcardSet | null> => {
//   try {
//     const filePath = `${FLASHCARDS_DIR}${id}.txt`;
//     const fileInfo = await FileSystem.getInfoAsync(filePath);
    
//     if (!fileInfo.exists) {
//       console.log('Archivo no existe:', filePath);
//       return null;
//     }
    
//     const content = await FileSystem.readAsStringAsync(filePath);
//     const lines = content.split('\n');
//     const name = lines[0];
//     const cards: Flashcard[] = [];
    
//     for (let i = 2; i < lines.length; i++) {
//       const line = lines[i].trim();
//       if (line === '') continue;
      
//       const parts = line.split('|');
//       if (parts.length >= 2) {
//         cards.push({
//           id: `card_${Date.now()}_${i}`,
//           front: parts[0],
//           back: parts[1],
//           mastered: parts[2] === '1',
//         });
//       }
//     }
    
//     return {
//       id,
//       name,
//       cards,
//       createdAt: fileInfo.modificationTime ? new Date(fileInfo.modificationTime).toISOString() : new Date().toISOString(),
//     };
//   } catch (error) {
//     console.error('Error al cargar set:', error);
//     return null;
//   }
// };

// // Eliminar un set
// export const deleteFlashcardSet = async (id: string): Promise<boolean> => {
//   try {
//     const filePath = `${FLASHCARDS_DIR}${id}.txt`;
//     const fileInfo = await FileSystem.getInfoAsync(filePath);
//     if (fileInfo.exists) {
//       await FileSystem.deleteAsync(filePath);
//     }
//     return true;
//   } catch (error) {
//     console.error('Error al eliminar set:', error);
//     return false;
//   }
// };

// // Actualizar progreso de una tarjeta
// export const updateCardProgress = async (setId: string, cardId: string, mastered: boolean): Promise<boolean> => {
//   const set = await loadFlashcardSet(setId);
//   if (!set) return false;
  
//   const cardIndex = set.cards.findIndex(c => c.id === cardId);
//   if (cardIndex === -1) return false;
  
//   set.cards[cardIndex].mastered = mastered;
//   set.lastStudied = new Date().toISOString();
  
//   return await saveFlashcardSet(set);
// };

// // Exportar set como archivo de texto para compartir
// export const exportFlashcardSet = async (setId: string): Promise<string | null> => {
//   try {
//     const set = await loadFlashcardSet(setId);
//     if (!set) return null;
    
//     let content = `=== ${set.name} ===\n\n`;
//     content += `Total de tarjetas: ${set.cards.length}\n`;
//     content += `Dominadas: ${set.cards.filter(c => c.mastered).length}\n`;
//     content += `Pendientes: ${set.cards.filter(c => !c.mastered).length}\n\n`;
//     content += `--- TARJETAS ---\n\n`;
    
//     for (const card of set.cards) {
//       content += `❓ ${card.front}\n`;
//       content += `✅ ${card.back}\n`;
//       content += `${card.mastered ? '✓ Dominada' : '○ Pendiente'}\n`;
//       content += `${'-'.repeat(40)}\n\n`;
//     }
    
//     const exportPath = `${FileSystem.documentDirectory}export_${setId}.txt`;
//     await FileSystem.writeAsStringAsync(exportPath, content);
    
//     return exportPath;
//   } catch (error) {
//     console.error('Error al exportar set:', error);
//     return null;
//   }
// };

// // Importar set desde archivo de texto
// export const importFlashcardSet = async (fileUri: string): Promise<FlashcardSet | null> => {
//   try {
//     const content = await FileSystem.readAsStringAsync(fileUri);
//     const lines = content.split('\n');
    
//     let name = `Set_${Date.now()}`;
//     let cards: Flashcard[] = [];
//     let currentCard: { front?: string; back?: string } = {};
    
//     for (let i = 0; i < lines.length; i++) {
//       const line = lines[i].trim();
      
//       if (line.startsWith('❓')) {
//         currentCard.front = line.substring(2).trim();
//       } else if (line.startsWith('✅') && currentCard.front) {
//         currentCard.back = line.substring(2).trim();
//         cards.push({
//           id: `card_${Date.now()}_${cards.length}`,
//           front: currentCard.front,
//           back: currentCard.back,
//           mastered: false,
//         });
//         currentCard = {};
//       } else if (line.startsWith('===') && cards.length === 0) {
//         const match = line.match(/=== (.*) ===/);
//         if (match) name = match[1];
//       }
//     }
    
//     if (cards.length === 0) return null;
    
//     const newSet: FlashcardSet = {
//       id: Date.now().toString(),
//       name,
//       cards,
//       createdAt: new Date().toISOString(),
//     };
    
//     await saveFlashcardSet(newSet);
//     return newSet;
//   } catch (error) {
//     console.error('Error al importar set:', error);
//     return null;
//   }
// };

// services/flashcardStorage.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
  coverBase64?: string;      // 🔥 NUEVO: imagen de portada en Base64
  coverSizeKB?: number;       // 🔥 NUEVO: tamaño de la imagen
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
    await FileSystem.makeDirectoryAsync(FLASHCARDS_DIR, { intermediates: true });
  }
};

// 🔥 NUEVO: Convertir imagen a Base64 para portada
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    // Redimensionar a 200px (tamaño óptimo para portadas)
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

// 🔥 NUEVO: Seleccionar imagen para portada
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

// 🔥 NUEVO: Calcular tamaño del Base64
const getBase64Size = (base64: string): number => {
  const base64Data = base64.split(',')[1] || base64;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024;
};

// Guardar un set de flashcards (MODIFICADO para incluir portada)
export const saveFlashcardSet = async (set: FlashcardSet): Promise<boolean> => {
  try {
    await ensureDirectory();
    
    // Formato: NOMBRE\n---\nPORTADA\n---\nFRONT|BACK|MASTERED
    let content = `${set.name}\n---\n`;
    content += `${set.coverBase64 || ''}\n---\n`;
    
    for (const card of set.cards) {
      // Asegurar que mastered se guarda como 1 o 0
      const masteredValue = card.mastered ? '1' : '0';
      content += `${card.front}|${card.back}|${masteredValue}\n`;
    }
    
    const filePath = `${FLASHCARDS_DIR}${set.id}.txt`;
    await FileSystem.writeAsStringAsync(filePath, content);
    console.log('✅ Set guardado en:', filePath);
    console.log(`📊 Tarjetas: ${set.cards.length}`);
    console.log(`⭐ Dominadas: ${set.cards.filter(c => c.mastered).length}`);
    return true;
  } catch (error) {
    console.error('Error al guardar set:', error);
    return false;
  }
};

// 🔥 NUEVO: Actualizar solo la portada de un set
export const updateSetCover = async (setId: string, imageUri: string): Promise<boolean> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    const base64 = await imageToBase64(imageUri);
    const sizeKB = getBase64Size(base64);
    
    set.coverBase64 = base64;
    set.coverSizeKB = sizeKB;
    
    console.log(`✅ Portada actualizada. Tamaño: ${sizeKB.toFixed(1)}KB`);
    return await saveFlashcardSet(set);
  } catch (error) {
    console.error('Error al actualizar portada:', error);
    return false;
  }
};

// 🔥 NUEVO: Eliminar portada de un set
export const deleteSetCover = async (setId: string): Promise<boolean> => {
  try {
    const set = await loadFlashcardSet(setId);
    if (!set) return false;
    
    set.coverBase64 = undefined;
    set.coverSizeKB = undefined;
    
    return await saveFlashcardSet(set);
  } catch (error) {
    console.error('Error al eliminar portada:', error);
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

// Cargar un set específico (MODIFICADO para leer portada)
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
    
    // Leer portada
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
        // 🔥 CORRECCIÓN: Usar el ID guardado en el archivo si existe, o generar uno nuevo
        let cardId: string;
        if (parts.length >= 3 && parts[2] && (parts[2] === '0' || parts[2] === '1')) {
          // Formato con mastered al final: front|back|mastered
          cardId = `card_${Date.now()}_${i}`;
        } else if (parts.length >= 3 && parts[2].startsWith('card_')) {
          // El tercer campo es el ID
          cardId = parts[2];
          // El cuarto campo sería mastered
          const mastered = parts[3] === '1';
        } else {
          cardId = `card_${Date.now()}_${i}`;
        }
        
        // Mejor: Guardar el ID en el archivo para mantener consistencia
        // Por ahora, generamos IDs consistentes basados en el contenido
        // 🔥 CORRECCIÓN CLAVE: Usar un ID basado en el contenido para que sea consistente
        const contentHash = `${parts[0]}_${parts[1]}`.replace(/[^a-zA-Z0-9]/g, '_');
        const consistentId = `card_${id}_${contentHash.substring(0, 20)}`;
        
        cards.push({
          id: consistentId, // ID consistente basado en el set y el contenido
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
  try {
    console.log(`🔄 Actualizando tarjeta ${cardId} en set ${setId} a mastered=${mastered}`);
    
    // 1. Cargar el set completo
    const set = await loadFlashcardSet(setId);
    if (!set) {
      console.error(`❌ Set ${setId} no encontrado`);
      return false;
    }
    
    // 2. Encontrar la tarjeta y actualizar su estado
    const cardIndex = set.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      console.error(`❌ Tarjeta ${cardId} no encontrada en el set`);
      return false;
    }
    
    // 3. Actualizar la tarjeta
    set.cards[cardIndex].mastered = mastered;
    set.lastStudied = new Date().toISOString();
    
    console.log(`✅ Tarjeta actualizada. Nuevo estado: ${set.cards[cardIndex].mastered}`);
    
    // 4. Guardar el set completo
    const success = await saveFlashcardSet(set);
    
    if (success) {
      console.log(`✅ Set ${setId} guardado correctamente con progreso actualizado`);
    } else {
      console.error(`❌ Error al guardar el set ${setId}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error al actualizar progreso:', error);
    return false;
  }
};

// Exportar set como archivo de texto para compartir (incluye portada)
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
    
    return exportPath;
  } catch (error) {
    console.error('Error al exportar set:', error);
    return null;
  }
};

// Importar set desde archivo de texto (reconoce portada)
export const importFlashcardSet = async (fileUri: string): Promise<FlashcardSet | null> => {
  try {
    const content = await FileSystem.readAsStringAsync(fileUri);
    const lines = content.split('\n');
    
    let name = `Set_${Date.now()}`;
    let coverBase64: string | undefined;
    let cards: Flashcard[] = [];
    let currentCard: { front?: string; back?: string } = {};
    let readingCover = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '--- PORTADA (Base64) ---') {
        readingCover = true;
        continue;
      }
      
      if (readingCover && line.startsWith('data:image/')) {
        coverBase64 = line;
        readingCover = false;
        continue;
      }
      
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
      coverBase64,
    };
    
    await saveFlashcardSet(newSet);
    return newSet;
  } catch (error) {
    console.error('Error al importar set:', error);
    return null;
  }

  
};



