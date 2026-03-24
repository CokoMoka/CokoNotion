// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import AnimatedSplashScreen from '../../components/AnimatedSplashScreen';

//import { Colors } from '@/constants/theme';

export const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: '#df96c0', // <--- Asegúrate de que esto exista
    tabIconDefault: '#ccc',
    tabIconSelected: '#df96c0',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: '#df96c0', // <--- Y aquí también
    tabIconDefault: '#ccc',
    tabIconSelected: '#df96c0',
  },
};

export default function AuthLayout() {
  const [isSplashAnimationFinished, setSplashAnimationFinished] = useState(false);
  const [isAppReady, setAppReady] = useState(false);

  useEffect(() => {
    // Simula carga de recursos (fuentes, auth, etc.)
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); 
      } finally {
        setAppReady(true);
        // Ocultamos el splash nativo del sistema
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isAppReady || !isSplashAnimationFinished) {
    return (
      <AnimatedSplashScreen 
        onFinish={() => setSplashAnimationFinished(true)} 
      />
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}