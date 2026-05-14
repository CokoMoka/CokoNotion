// services/imageUtils.ts
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

// Convertir imagen a Base64 (con diferentes configuraciones)
export const imageToBase64 = async (
  uri: string, 
  type: 'avatar' | 'banner' | 'cover' = 'avatar'
): Promise<string> => {
  try {
    let resizeConfig;
    let compressQuality = 0.7;
    
    switch (type) {
      case 'avatar':
        resizeConfig = [{ resize: { width: 200 } }];
        compressQuality = 0.7;
        break;
      case 'banner':
        resizeConfig = [{ resize: { width: 800 } }];
        compressQuality = 0.6;
        break;
      case 'cover':
        resizeConfig = [{ resize: { width: 300, height: 300 } }];
        compressQuality = 0.8;
        break;
    }
    
    const result = await manipulateAsync(
      uri,
      resizeConfig,
      { compress: compressQuality, format: SaveFormat.JPEG }
    );
    
    const base64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Detectar tipo MIME
    const extension = uri.split('.').pop()?.toLowerCase() || 'jpeg';
    const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error(`Error al convertir imagen (${type}) a Base64:`, error);
    throw error;
  }
};

// Seleccionar imagen (con opciones por tipo)
export const pickImage = async (
  type: 'avatar' | 'banner' | 'cover' = 'avatar'
): Promise<string | null> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Se necesita permiso para acceder a la galería');
    return null;
  }
  
  const options: any = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  };
  
  switch (type) {
    case 'avatar':
      options.allowsEditing = true;
      options.aspect = [1, 1];
      break;
    case 'banner':
      options.allowsEditing = false;
      break;
    case 'cover':
      options.allowsEditing = true;
      options.aspect = [1, 1];
      break;
  }
  
  const result = await ImagePicker.launchImageLibraryAsync(options);
  
  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
};

// Tomar foto para avatar (solo avatar)
export const takePhoto = async (): Promise<string | null> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    alert('Se necesita permiso para usar la cámara');
    return null;
  }
  
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  
  if (!result.canceled) {
    return result.assets[0].uri;
  }
  return null;
};

// Calcular tamaño del Base64 (en KB)
export const getBase64Size = (base64: string): number => {
  const base64Data = base64.split(',')[1] || base64;
  const sizeInBytes = (base64Data.length * 3) / 4;
  return sizeInBytes / 1024;
};