// hooks/useUser.ts
import { useEffect, useState, useCallback } from 'react';
import { getCurrentUser, getUserData } from '../services/auth';
import { initDatabase } from '../services/database';

export const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      const userData = await getUserData(currentUser.uid);
      setUser({ ...currentUser, ...userData });
    }
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          const userData = await getUserData(currentUser.uid);
          setUser({ ...currentUser, ...userData });
          
          // 🔥 Inicializar SQLite SOLO después de tener usuario
          await initDatabase();
          console.log('✅ SQLite inicializada para usuario:', currentUser.uid);
        }
      } catch (error) {
        console.error('Error al cargar usuario:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  return { user, loading, refreshUser };
};