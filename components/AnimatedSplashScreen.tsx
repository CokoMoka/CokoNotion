import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// Evita que el splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync();

export default function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  const pulseAnim = useRef(new Animated.Value(1)).current; // Escala inicial 1

  useEffect(() => {
    // Definimos la animación de pulsación (Beat lento)
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.1, // Crece un 10%
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1, // Vuelve al tamaño original
        duration: 450,
        useNativeDriver: true,
      }),
    ]);

    // Ejecutar en bucle 2 veces y luego avisar que terminó
    Animated.loop(pulse, { iterations: 2 }).start(() => {
      onFinish();
    });
  }, []);

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../assets/images/wbg_Icono_CokoNa.png')}
        style={[
          styles.image,
          {
            transform: [{ scale: pulseAnim }], // Aplicamos la escala animada
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 200,
  },
});