import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser  // ✅ Agregar esta importación
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'; // ✅ Agregar deleteDoc
import { auth, db } from './firebase';


export interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  createdAt: string;
  lastLogin: string;
  photoURL?: string;
  racha?: number;
  horasEstudio?: number;
  tareasCompletadas?: number;
  modoOscuro?: boolean;
  notificaciones?: boolean;
  recordatorios?: boolean;
  sonidos?: boolean;
}

// ========== FUNCIONES DE AUTENTICACIÓN ==========

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export { auth };

// Obtener datos del usuario desde Firestore (con nombre de Auth también)
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const user = auth.currentUser;
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as UserData;
      // Asegurar que el nombre de Auth está sincronizado
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

// Obtener perfil completo (nombre y email desde Auth + Firestore)
export const getUserProfile = async (): Promise<{ nombre: string; email: string } | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    
    let nombre = user.displayName || "";
    const email = user.email || "";
    
    // Intentar obtener datos de Firestore (por si el nombre está allí)
    const userData = await getUserData(user.uid);
    if (userData?.displayName && !nombre) {
      nombre = userData.displayName;
    }
    
    return { nombre, email };
  } catch (error) {
    console.log('Error al obtener perfil:', error);
    return null;
  }
};

// Registrar nuevo usuario
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Actualizar perfil en Firebase Auth
    await firebaseUpdateProfile(user, { displayName });

    // ✅ Guardar datos adicionales en Firestore
    const userData: UserData = {
      uid: user.uid,
      email: user.email!,
      displayName,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      racha: 0,
      horasEstudio: 0,
      tareasCompletadas: 0,
      modoOscuro: true,
      notificaciones: true,
      recordatorios: true,
      sonidos: false,
    };

    await setDoc(doc(db, 'users', user.uid), userData);

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
        errorMessage = 'Error al registrar usuario. Intenta nuevamente';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Iniciar sesión
export const loginUser = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: User }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Actualizar último login en Firestore
    await updateDoc(doc(db, 'users', user.uid), {
      lastLogin: new Date().toISOString()
    });

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
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu internet';
        break;
      default:
        errorMessage = 'Error al iniciar sesión. Intenta nuevamente';
    }
    
    return { success: false, error: errorMessage };
  }
};

// Cerrar sesión
export const logoutUser = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.log('Error al cerrar sesión:', error.code);
    return { success: false, error: 'Error al cerrar sesión' };
  }
};

// Recuperar contraseña
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

// ========== FUNCIONES DE FIRESTORE ==========

// services/auth.ts - Actualizar updateUserProfile
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
    
    // ✅ Actualizar email (requiere reautenticación reciente)
    if (updates.email && user && updates.email !== user.email) {
      try {
        console.log('Intentando cambiar email a:', updates.email);
        await firebaseUpdateEmail(user, updates.email);
        console.log('Email actualizado correctamente');
      } catch (emailError: any) {
        console.log('Error al actualizar email:', emailError.code);
        
        switch (emailError.code) {
          case 'auth/email-already-in-use':
            return { success: false, error: 'Este correo ya está en uso por otra cuenta' };
          case 'auth/operation-not-allowed':
            return { success: false, error: 'El cambio de correo no está habilitado. Verifica que Email/Password esté activado en Firebase Console' };
          case 'auth/requires-recent-login':
            return { success: false, error: 'Por seguridad, debes volver a iniciar sesión antes de cambiar tu correo' };
          case 'auth/invalid-email':
            return { success: false, error: 'Correo electrónico inválido' };
          default:
            return { success: false, error: `Error al cambiar email: ${emailError.code}` };
        }
      }
    }
    
    // ✅ Actualizar nombre
    if (updates.displayName && user && updates.displayName !== user.displayName) {
      try {
        await firebaseUpdateProfile(user, { displayName: updates.displayName });
      } catch (profileError: any) {
        console.log('Error al actualizar nombre:', profileError.code);
      }
    }
    
    // ✅ Actualizar en Firestore
    const userRef = doc(db, 'users', uid);
    const updateData: any = {};
    
    if (updates.displayName !== undefined) updateData.displayName = updates.displayName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.modoOscuro !== undefined) updateData.modoOscuro = updates.modoOscuro;
    if (updates.notificaciones !== undefined) updateData.notificaciones = updates.notificaciones;
    if (updates.recordatorios !== undefined) updateData.recordatorios = updates.recordatorios;
    if (updates.sonidos !== undefined) updateData.sonidos = updates.sonidos;
    
    updateData.lastLogin = new Date().toISOString();
    
    await updateDoc(userRef, updateData);
    
    return { success: true };
  } catch (error: any) {
    console.log('Error general al actualizar perfil:', error);
    return { success: false, error: 'Error al actualizar perfil' };
  }
};

// Actualizar preferencias del usuario
export const updateUserPreferences = async (
  uid: string,
  preferences: {
    modoOscuro?: boolean;
    notificaciones?: boolean;
    recordatorios?: boolean;
    sonidos?: boolean;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, preferences);
    return { success: true };
  } catch (error) {
    console.log('Error al actualizar preferencias:', error);
    return { success: false, error: 'Error al actualizar preferencias' };
  }
};

// Actualizar estadísticas del usuario
export const updateUserStats = async (
  uid: string,
  stats: {
    racha?: number;
    horasEstudio?: number;
    tareasCompletadas?: number;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, stats);
    return { success: true };
  } catch (error) {
    console.log('Error al actualizar estadísticas:', error);
    return { success: false, error: 'Error al actualizar estadísticas' };
  }
};
// services/auth.ts - Mejorar reauthenticateUser
export const reauthenticateUser = async (password: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    
    // Crear credencial con email y contraseña
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
      case 'auth/user-mismatch':
        return { success: false, error: 'Usuario no coincide' };
      case 'auth/network-request-failed':
        return { success: false, error: 'Error de conexión. Verifica tu internet' };
      default:
        return { success: false, error: `Error al verificar: ${error.code}` };
    }
  }
};

export const deleteCurrentAccount = async (
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      return { success: false, error: 'No hay usuario autenticado' };
    }
    
    // ✅ Reautenticar al usuario antes de eliminar
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
    
    // ✅ Eliminar datos del usuario en Firestore
    await deleteDoc(doc(db, 'users', user.uid));
    
    // ✅ Eliminar la cuenta de Firebase Auth
    await deleteUser(user);
    
    return { success: true };
  } catch (error: any) {
    console.log('Error al eliminar cuenta:', error.code);
    
    let errorMessage = 'Error al eliminar la cuenta';
    switch (error.code) {
      case 'auth/wrong-password':
        errorMessage = 'Contraseña incorrecta';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos. Intenta más tarde';
        break;
      case 'auth/requires-recent-login':
        errorMessage = 'Por seguridad, debes volver a iniciar sesión antes de eliminar tu cuenta';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu internet';
        break;
      default:
        errorMessage = `Error al eliminar cuenta: ${error.code}`;
    }
    
    return { success: false, error: errorMessage };
  }
};