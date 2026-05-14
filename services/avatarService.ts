// services/userStorageService.ts
import { getDatabase, ref, set, get, update } from 'firebase/database';
import { imageToBase64, pickImage, takePhoto, getBase64Size } from './ImagenUtils';
import { getCurrentUser } from './auth';

const database = getDatabase();

// ========== AVATAR ==========
export const saveAvatarToRTDB = async (base64Image: string): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    const sizeKB = getBase64Size(base64Image);
    
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, {
      avatarBase64: base64Image,
      avatarUpdatedAt: new Date().toISOString(),
      avatarSizeKB: sizeKB,
    });
    
    return true;
  } catch (error) {
    console.error('Error al guardar avatar:', error);
    return false;
  }
};

export const uploadAvatarFromGallery = async (): Promise<boolean> => {
  const imageUri = await pickImage('avatar');
  if (!imageUri) return false;
  const base64 = await imageToBase64(imageUri, 'avatar');
  return await saveAvatarToRTDB(base64);
};

export const uploadAvatarFromCamera = async (): Promise<boolean> => {
  const imageUri = await takePhoto();
  if (!imageUri) return false;
  const base64 = await imageToBase64(imageUri, 'avatar');
  return await saveAvatarToRTDB(base64);
};

export const getUserAvatar = async (uid: string): Promise<string | null> => {
  try {
    const userRef = ref(database, `users/${uid}/avatarBase64`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error al obtener avatar:', error);
    return null;
  }
};

export const deleteAvatar = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, { avatarBase64: null, avatarUpdatedAt: null, avatarSizeKB: null });
    return true;
  } catch (error) {
    console.error('Error al eliminar avatar:', error);
    return false;
  }
};

// ========== BANNER ==========
export const saveBannerToRTDB = async (base64Image: string): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    const sizeKB = getBase64Size(base64Image);
    
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, {
      bannerBase64: base64Image,
      bannerUpdatedAt: new Date().toISOString(),
      bannerSizeKB: sizeKB,
    });
    
    return true;
  } catch (error) {
    console.error('Error al guardar banner:', error);
    return false;
  }
};

export const uploadBannerFromGallery = async (): Promise<boolean> => {
  const imageUri = await pickImage('banner');
  if (!imageUri) return false;
  const base64 = await imageToBase64(imageUri, 'banner');
  return await saveBannerToRTDB(base64);
};

export const getUserBanner = async (uid: string): Promise<string | null> => {
  try {
    const userRef = ref(database, `users/${uid}/bannerBase64`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error al obtener banner:', error);
    return null;
  }
};

export const deleteBanner = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, { bannerBase64: null, bannerUpdatedAt: null, bannerSizeKB: null });
    return true;
  } catch (error) {
    console.error('Error al eliminar banner:', error);
    return false;
  }
};

// ========== COVER (para Pomodoro) ==========
export const saveCoverToRTDB = async (base64Image: string): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    const sizeKB = getBase64Size(base64Image);
    
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, {
      coverBase64: base64Image,
      coverUpdatedAt: new Date().toISOString(),
      coverSizeKB: sizeKB,
    });
    
    console.log(`✅ Cover guardado. Tamaño: ${sizeKB.toFixed(1)}KB`);
    return true;
  } catch (error) {
    console.error('Error al guardar cover:', error);
    return false;
  }
};

export const uploadCoverFromGallery = async (): Promise<boolean> => {
  const imageUri = await pickImage('cover');
  if (!imageUri) return false;
  const base64 = await imageToBase64(imageUri, 'cover');
  return await saveCoverToRTDB(base64);
};

export const getUserCover = async (uid: string): Promise<string | null> => {
  try {
    const userRef = ref(database, `users/${uid}/coverBase64`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error al obtener cover:', error);
    return null;
  }
};

export const deleteCover = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, { coverBase64: null, coverUpdatedAt: null, coverSizeKB: null });
    return true;
  } catch (error) {
    console.error('Error al eliminar cover:', error);
    return false;
  }
};

// ========== BACKGROUND (Fondo general de la app) ==========
export const saveBackgroundToRTDB = async (base64Image: string): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');
    
    const sizeKB = getBase64Size(base64Image);
    
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, {
      backgroundBase64: base64Image,
      backgroundUpdatedAt: new Date().toISOString(),
      backgroundSizeKB: sizeKB,
    });
    
    console.log(`✅ Fondo guardado. Tamaño: ${sizeKB.toFixed(1)}KB`);
    return true;
  } catch (error) {
    console.error('Error al guardar fondo:', error);
    return false;
  }
};

export const uploadBackgroundFromGallery = async (): Promise<boolean> => {
  const imageUri = await pickImage('banner'); // Usa configuración de banner
  if (!imageUri) return false;
  const base64 = await imageToBase64(imageUri, 'banner');
  return await saveBackgroundToRTDB(base64);
};

export const getUserBackground = async (uid: string): Promise<string | null> => {
  try {
    const userRef = ref(database, `users/${uid}/backgroundBase64`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error al obtener fondo:', error);
    return null;
  }
};

export const deleteBackground = async (): Promise<boolean> => {
  try {
    const user = getCurrentUser();
    if (!user) return false;
    const userRef = ref(database, `users/${user.uid}`);
    await update(userRef, { backgroundBase64: null, backgroundUpdatedAt: null, backgroundSizeKB: null });
    return true;
  } catch (error) {
    console.error('Error al eliminar fondo:', error);
    return false;
  }
};