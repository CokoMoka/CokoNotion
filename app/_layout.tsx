// app/_layout.tsx
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View, Alert } from 'react-native';
import { auth } from '../services/firebase';
import { useShake } from '../hooks/useShake';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  // 🔥 Detectar si estamos en tabs (autenticados)
  const isInTabs = segments[0] === '(tabs)';
  
  // 🔥 SHAKE - Solo funciona cuando el usuario está autenticado y en tabs
  useShake({
    threshold: 1.5,
    timeout: 1000,
    enabled: isAuthenticated === true && isInTabs,
    onShake: () => {
      console.log('¡Agitón detectado! Abriendo notas...');
      Alert.alert(
        '🙊 ¡Teléfono agitado!',
        '¿Abrir la sección de Notas?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Notas', onPress: () => router.push('/NotasN') }
        ]
      );
    }
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/Main');
    }
  }, [isAuthenticated, segments]);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#df96c0" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}