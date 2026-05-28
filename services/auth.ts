// services/auth.ts - VERSIÓN COMPLETA CON AUDITORÍA

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser  
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { auth, db, storage } from './firebase';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { logAudit } from './auditLogger';
import { Platform } from 'react-native';

// ... (mantén tu interfaz UserData igual) ...

export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLogin: string;
  photoURL?: string;
  bannerURL?: string | null;
  avatarURL?: string | null;
  backgroundURL?: string | null;
  coverURL?: string | null;
  racha?: number;
  horasEstudio?: number;
  tareasCompletadas?: number;
  recompensas?: number;
  modoOscuro?: boolean;
  notificaciones?: boolean;
  recordatorios?: boolean;
  sonidos?: boolean;
  totalPomodoros?: number;
  pomodorosHoy?: number;
  minutosEstudioHoy?: number;
  ultimoDiaEstudio?: string | null;
  fraseMotivacional?: string;
  autorFrase?: string;
}

// ========== FUNCIONES PARA MANEJAR IMÁGENES CON AUDITORÍA ==========

const processImage = async (uri: string): Promise<string> => {
  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    return result.uri;
  } catch (error) {
    console.log('Error al procesar imagen:', error);
    return uri;
  }
};

// 🔥 MEJORADO: uploadUserAvatar con auditoría
export const uploadUserAvatar = async (
  uid: string,
  imageUri: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const oldUserData = await getUserData(uid);
    const oldAvatarURL = oldUserData?.avatarURL;
    
    const processedUri = await processImage(imageUri);
    const response = await fetch(processedUri);
    const blob = await response.blob();
    
    const imageRef = ref(storage, `users/${uid}/avatar.jpg`);
    await uploadBytes(imageRef, blob);
    
    const downloadUrl = await getDownloadURL(imageRef);
    
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { avatarURL: downloadUrl });
    
    const user = auth.currentUser;
    if (user) {
      await firebaseUpdateProfile(user, { photoURL: downloadUrl });
    }
    
    // ✅ Registrar auditoría
    await logAudit(
      'UPDATE_AVATAR',
      uid,
      user?.displayName || 'Usuario',
      `Avatar actualizado`,
      { previousAvatar: oldAvatarURL },
      { newAvatar: downloadUrl }
    );
    
    return { success: true, url: downloadUrl };
  } catch (error: any) {
    console.log('Error al subir avatar:', error);
    return { success: false, error: error.message };
  }
};

// 🔥 MEJORADO: uploadUserBanner con auditoría
export const uploadUserBanner = async (
  uid: string,
  imageUri: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const oldUserData = await getUserData(uid);
    const oldBannerURL = oldUserData?.bannerURL;
    
    const result = await manipulateAsync(
      imageUri,
      [{ resize: { width: 1200 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );
    
    const response = await fetch(result.uri);
    const blob = await response.blob();
    
    const imageRef = ref(storage, `users/${uid}/banner.jpg`);
    await uploadBytes(imageRef, blob);
    
    const downloadUrl = await getDownloadURL(imageRef);
    
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { bannerURL: downloadUrl });
    
    // ✅ Registrar auditoría
    await logAudit(
      'UPDATE_BANNER',
      uid,
      auth.currentUser?.displayName || 'Usuario',
      `Banner actualizado`,
      { previousBanner: oldBannerURL },
      { newBanner: downloadUrl }
    );
    
    return { success: true, url: downloadUrl };
  } catch (error: any) {
    console.log('Error al subir banner:', error);
    return { success: false, error: error.message };
  }
};

// 🔥 MEJORADO: deleteUserAvatar con auditoría
export const deleteUserAvatar = async (uid: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const oldUserData = await getUserData(uid);
    const oldAvatarURL = oldUserData?.avatarURL;
    
    const imageRef = ref(storage, `users/${uid}/avatar.jpg`);
    await deleteObject(imageRef);
    
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { avatarURL: null });
    
    // ✅ Registrar auditoría
    await logAudit(
      'DELETE_AVATAR',
      uid,
      auth.currentUser?.displayName || 'Usuario',
      `Avatar eliminado`,
      { previousAvatar: oldAvatarURL },
      { newAvatar: null }
    );
    
    return { success: true };
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }
    console.log('Error al eliminar avatar:', error);
    return { success: false, error: error.message };
  }
};

// 🔥 MEJORADO: deleteUserBanner con auditoría
export const deleteUserBanner = async (uid: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const oldUserData = await getUserData(uid);
    const oldBannerURL = oldUserData?.bannerURL;
    
    const imageRef = ref(storage, `users/${uid}/banner.jpg`);
    await deleteObject(imageRef);
    
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, { bannerURL: null });
    
    // ✅ Registrar auditoría
    await logAudit(
      'DELETE_BANNER',
      uid,
      auth.currentUser?.displayName || 'Usuario',
      `Banner eliminado`,
      { previousBanner: oldBannerURL },
      { newBanner: null }
    );
    
    return { success: true };
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      return { success: true };
    }
    console.log('Error al eliminar banner:', error);
    return { success: false, error: error.message };
  }
};

// ... (mantén pickImage y takePhoto igual) ...

// ========== FUNCIONES DE AUTENTICACIÓN ==========

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export { auth };

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserData;
      const user = auth.currentUser;
      if (user?.displayName && !data.displayName) {
        data.displayName = user.displayName;
      }
      return data;
    }
    return null;
  } catch (error) {
    console.log('Error al obtener datos del usuario');
    return null;
  }
};

export const getUserProfile = async (): Promise<{ 
  nombre: string; 
  email: string; 
  avatarURL?: string; 
  bannerURL?: string;
} | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    let nombre = user.displayName || "";
    const email = user.email || "";
    
    const userData = await getUserData(user.uid);
    const avatarURL = userData?.avatarURL || user.photoURL || undefined;
    const bannerURL = userData?.bannerURL || undefined;
    
    if (userData?.displayName && !nombre) {
      nombre = userData.displayName;
    }
    
    return { nombre, email, avatarURL, bannerURL };
  } catch (error) {
    console.log('Error al obtener perfil:', error);
    return null;
  }
};

// 🔥 MEJORADO: registerUser con auditoría ya lo tienes ✅
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await firebaseUpdateProfile(user, { displayName });

    const userData: UserData = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      racha: 0,
      horasEstudio: 0,
      tareasCompletadas: 0,
      recompensas: 0,
      modoOscuro: true,
      notificaciones: true,
      recordatorios: true,
      sonidos: false,
      totalPomodoros: 0,
      pomodorosHoy: 0,
      minutosEstudioHoy: 0,
      ultimoDiaEstudio: null,
      avatarURL: null,
      bannerURL: null,
      backgroundURL: null,
      coverURL: null,
      fraseMotivacional: "¡Sigue así! Cada día es una oportunidad",
      autorFrase: "CokoNotion",
    };

    await setDoc(doc(db, 'users', user.uid), userData);
    console.log('✅ Usuario guardado en Firestore');
    
    await logAudit(
      'USER_REGISTER',
      user.uid,
      displayName,
      `Usuario registrado con email: ${email}`,
      null,
      { email, displayName }
    );

    return { success: true, user };
  } catch (error: any) {
    console.log('Error en registro:', error.code);
    
    let errorMessage = 'Error al registrar usuario';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        break;
      default:
        errorMessage = error.message || 'Error al registrar usuario';
    }
    
    return { success: false, error: errorMessage };
  }
};

// 🔥 MEJORADO: loginUser con auditoría ya lo tienes ✅
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date().toISOString()
    });

    await logAudit(
      'USER_LOGIN',
      user.uid,
      user.displayName || email,
      `Inicio de sesión desde ${Platform.OS}`,
      null,
      { platform: Platform.OS, timestamp: new Date().toISOString() }
    );

    return { success: true, user };
  } catch (error: any) {
    console.log('Error en login:', error.code);
    
    let errorMessage = 'Error al iniciar sesión';
    
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        errorMessage = 'Correo o contraseña incorrectos';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Intenta más tarde';
        break;
      default:
        errorMessage = 'Error al iniciar sesión. Intenta nuevamente';
    }
    
    return { success: false, error: errorMessage };
  }
};

// 🔥 MEJORADO: logoutUser con auditoría
export const logoutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (user) {
      await logAudit(
        'USER_LOGOUT',
        user.uid,
        user.displayName || 'Usuario',
        `Cierre de sesión desde ${Platform.OS}`,
        null,
        { platform: Platform.OS }
      );
    }
    
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.log('Error al cerrar sesión:', error.code);
    return { success: false, error: 'Error al cerrar sesión' };
  }
};

export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    console.log('Error al enviar email:', error.code);
    
    let errorMessage = 'Error al enviar email de recuperación';
    
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No existe una cuenta con este correo';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Correo electrónico inválido';
        break;
      default:
        errorMessage = 'Error al enviar email. Intenta nuevamente';
    }
    
    return { success: false, error: errorMessage };
  }
};

// ========== FUNCIONES DE ACTUALIZACIÓN MEJORADAS ==========

// 🔥 NUEVA FUNCIÓN para obtener el estado anterior antes de actualizar
const getPreviousUserState = async (uid: string): Promise<any> => {
  try {
    const userData = await getUserData(uid);
    return userData;
  } catch (error) {
    console.log('Error al obtener estado anterior:', error);
    return null;
  }
};

// 🔥 MEJORADO: updateUserProfile con auditoría completa
export const updateUserProfile = async (
  uid: string,
  updates: {
    displayName?: string;
    email?: string;
    modoOscuro?: boolean;
    notificaciones?: boolean;
    recordatorios?: boolean;
    sonidos?: boolean;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    
    // 🔥 Obtener estado anterior
    const previousState = await getPreviousUserState(uid);
    const changes: string[] = [];
    
    // Actualizar email en Auth
    if (updates.email && user && updates.email !== user.email) {
      try {
        await firebaseUpdateEmail(user, updates.email);
        changes.push(`Email: ${previousState?.email} → ${updates.email}`);
        console.log('✅ Email actualizado en Auth');
      } catch (emailError: any) {
        console.log('Error al actualizar email:', emailError.code);
        switch (emailError.code) {
          case 'auth/email-already-in-use':
            return { success: false, error: 'Este correo ya está en uso por otra cuenta' };
          case 'auth/requires-recent-login':
            return { success: false, error: 'Por seguridad, debes volver a iniciar sesión' };
          default:
            return { success: false, error: `Error al cambiar email: ${emailError.code}` };
        }
      }
    }
    
    // Actualizar nombre en Auth
    if (updates.displayName && user && updates.displayName !== user.displayName) {
      try {
        await firebaseUpdateProfile(user, { displayName: updates.displayName });
        changes.push(`Nombre: ${previousState?.displayName} → ${updates.displayName}`);
        console.log('✅ Nombre actualizado en Auth');
      } catch (profileError: any) {
        console.log('Error al actualizar nombre:', profileError.code);
      }
    }
    
    // Actualizar en Firestore
    const userRef = doc(db, 'users', uid);
    const updateData: any = {};
    
    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.modoOscuro !== undefined) {
      updateData.modoOscuro = updates.modoOscuro;
      changes.push(`Modo Oscuro: ${previousState?.modoOscuro} → ${updates.modoOscuro}`);
    }
    if (updates.notificaciones !== undefined) {
      updateData.notificaciones = updates.notificaciones;
      changes.push(`Notificaciones: ${previousState?.notificaciones} → ${updates.notificaciones}`);
    }
    if (updates.recordatorios !== undefined) {
      updateData.recordatorios = updates.recordatorios;
      changes.push(`Recordatorios: ${previousState?.recordatorios} → ${updates.recordatorios}`);
    }
    if (updates.sonidos !== undefined) {
      updateData.sonidos = updates.sonidos;
      changes.push(`Sonidos: ${previousState?.sonidos} → ${updates.sonidos}`);
    }
    
    // Eliminar undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    updateData.lastLogin = new Date().toISOString();
    
    await updateDoc(userRef, updateData);
    console.log('✅ Datos actualizados en Firestore');
    
    // ✅ Registrar auditoría según el tipo de cambio
    if (updates.displayName && updates.displayName !== previousState?.displayName) {
      await logAudit(
        'UPDATE_PROFILE_NAME',
        uid,
        updates.displayName,
        `Nombre actualizado`,
        { previousName: previousState?.displayName },
        { newName: updates.displayName }
      );
    }
    
    if (updates.email && updates.email !== previousState?.email) {
      await logAudit(
        'UPDATE_PROFILE_EMAIL',
        uid,
        user.displayName || 'Usuario',
        `Email actualizado`,
        { previousEmail: previousState?.email },
        { newEmail: updates.email }
      );
    }
    
    if (updates.modoOscuro !== undefined || updates.notificaciones !== undefined || 
        updates.recordatorios !== undefined || updates.sonidos !== undefined) {
      await logAudit(
        'UPDATE_PROFILE_PREFERENCES',
        uid,
        user.displayName || 'Usuario',
        `Preferencias actualizadas: ${changes.filter(c => c.includes('Modo') || c.includes('Notificaciones') || c.includes('Recordatorios') || c.includes('Sonidos')).join(', ')}`,
        {
          previous: {
            modoOscuro: previousState?.modoOscuro,
            notificaciones: previousState?.notificaciones,
            recordatorios: previousState?.recordatorios,
            sonidos: previousState?.sonidos
          }
        },
        {
          new: {
            modoOscuro: updates.modoOscuro,
            notificaciones: updates.notificaciones,
            recordatorios: updates.recordatorios,
            sonidos: updates.sonidos
          }
        }
      );
    }
    
    return { success: true };
  } catch (error: any) {
    console.log('Error general al actualizar perfil:', error);
    return { success: false, error: 'Error al actualizar perfil' };
  }
};

// 🔥 MEJORADO: updateUserStats con auditoría
export const updateUserStats = async (
  uid: string,
  stats: {
    racha?: number;
    horasEstudio?: number;
    tareasCompletadas?: number;
    recompensas?: number;
    totalPomodoros?: number;
    pomodorosHoy?: number;
    minutosEstudioHoy?: number;
    ultimoDiaEstudio?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const previousState = await getPreviousUserState(uid);
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, stats);
    
    // ✅ Registrar cambios en estadísticas (opcional, si quieres trackear)
    const changes: string[] = [];
    if (stats.racha !== undefined && stats.racha !== previousState?.racha) {
      changes.push(`Racha: ${previousState?.racha} → ${stats.racha}`);
    }
    if (stats.horasEstudio !== undefined && stats.horasEstudio !== previousState?.horasEstudio) {
      changes.push(`Horas estudio: ${previousState?.horasEstudio} → ${stats.horasEstudio}`);
    }
    
    if (changes.length > 0) {
      await logAudit(
        'UPDATE_PROFILE_PREFERENCES', // Podrías crear 'UPDATE_STATS' si lo prefieres
        uid,
        auth.currentUser?.displayName || 'Usuario',
        `Estadísticas actualizadas: ${changes.join(', ')}`,
        { previous: previousState },
        { new: stats }
      );
    }
    
    return { success: true };
  } catch (error) {
    console.log('Error al actualizar estadísticas:', error);
    return { success: false, error: 'Error al actualizar estadísticas' };
  }
};

// 🔥 MEJORADO: updateUserPhrase con auditoría
export const updateUserPhrase = async (
  uid: string,
  frase: string,
  autor?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const previousState = await getPreviousUserState(uid);
    const userRef = doc(db, 'users', uid);
    const updates: any = { fraseMotivacional: frase };
    if (autor !== undefined) {
      updates.autorFrase = autor;
    }
    await updateDoc(userRef, updates);
    
    // ✅ Registrar auditoría de frase motivacional
    await logAudit(
      'UPDATE_PROFILE_PREFERENCES',
      uid,
      auth.currentUser?.displayName || 'Usuario',
      `Frase motivacional actualizada`,
      { 
        previousFrase: previousState?.fraseMotivacional,
        previousAutor: previousState?.autorFrase
      },
      { 
        newFrase: frase,
        newAutor: autor || previousState?.autorFrase
      }
    );
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar frase:', error);
    return { success: false, error: 'Error al actualizar la frase' };
  }
};

export const getUserPhrase = async (uid: string): Promise<{ frase: string; autor: string } | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        frase: data.fraseMotivacional || "¡Sigue así! Cada día es una oportunidad",
        autor: data.autorFrase || "CokoNotion"
      };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener frase:', error);
    return null;
  }
};

// ========== FUNCIONES DE REAUTHENTICACIÓN Y ELIMINACIÓN ==========

export const reauthenticateUser = async (password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    return { success: true };
  } catch (error: any) {
    console.log('Error al reautenticar:', error.code);
    
    switch (error.code) {
      case 'auth/wrong-password':
        return { success: false, error: 'Contraseña incorrecta' };
      case 'auth/too-many-requests':
        return { success: false, error: 'Demasiados intentos. Intenta más tarde' };
      default:
        return { success: false, error: `Error al verificar: ${error.code}` };
    }
  }
};

// 🔥 MEJORADO: deleteCurrentAccount con auditoría
export const deleteCurrentAccount = async (
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // ✅ Registrar antes de eliminar
    await logAudit(
      'DELETE_ACCOUNT',
      user.uid,
      user.displayName || 'Usuario',
      `Cuenta eliminada permanentemente`,
      { email: user.email, displayName: user.displayName },
      null
    );
    
    try {
      const avatarRef = ref(storage, `users/${user.uid}/avatar.jpg`);
      await deleteObject(avatarRef);
      const bannerRef = ref(storage, `users/${user.uid}/banner.jpg`);
      await deleteObject(bannerRef);
    } catch (storageError) {
      console.log('No se encontraron imágenes para eliminar');
    }
    
    await deleteDoc(doc(db, 'users', user.uid));
    await deleteUser(user);
    
    return { success: true };
  } catch (error: any) {
    console.log('Error al eliminar cuenta:', error.code);
    
    let errorMessage = 'Error al eliminar la cuenta';
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Por seguridad, debes volver a iniciar sesión';
        break;
      default:
        errorMessage = `Error al eliminar cuenta: ${error.code}`;
    }
    
    return { success: false, error: errorMessage };
  }
};