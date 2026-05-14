// hooks/useGyroscope.ts
import { useEffect, useRef, useState } from 'react';
import { Gyroscope } from 'expo-sensors';
import { Vibration } from 'react-native';

interface GyroOptions {
  enabled?: boolean;
  onLeftTilt?: () => void;
  onRightTilt?: () => void;
  onFlat?: () => void;
  threshold?: number;
  timeout?: number;
  vibrateOnGesture?: boolean;
}

export const useGyroscope = (options: GyroOptions = {}) => {
  const {
    enabled = true,
    onLeftTilt,
    onRightTilt,
    onFlat,
    threshold = 2.5,
    timeout = 800,
    vibrateOnGesture = true,
  } = options;
  
  const [isAvailable, setIsAvailable] = useState(false);
  const lastGestureTime = useRef(0);
  const subscription = useRef<any>(null);
  const wasFlat = useRef(false);
  
  useEffect(() => {
    const checkAvailability = async () => {
      const available = await Gyroscope.isAvailableAsync();
      setIsAvailable(available);
      console.log('📱 Giroscopio disponible:', available);
    };
    checkAvailability();
  }, []);
  
  useEffect(() => {
    if (!enabled || !isAvailable) return;
    
    Gyroscope.setUpdateInterval(100);
    
    subscription.current = Gyroscope.addListener(data => {
      const now = Date.now();
      if (now - lastGestureTime.current < timeout) return;
      
      const { x, y, z } = data;
      
      // Inclinación izquierda
      if (x < -threshold && onLeftTilt) {
        lastGestureTime.current = now;
        if (vibrateOnGesture) Vibration.vibrate(50);
        console.log(`🎮 Gesto: Inclinación izquierda`);
        onLeftTilt();
      }
      // Inclinación derecha
      else if (x > threshold && onRightTilt) {
        lastGestureTime.current = now;
        if (vibrateOnGesture) Vibration.vibrate(50);
        console.log(`🎮 Gesto: Inclinación derecha`);
        onRightTilt();
      }
      // Teléfono boca arriba
      else if (Math.abs(z) < 0.8 && onFlat && !wasFlat.current) {
        wasFlat.current = true;
        if (vibrateOnGesture) Vibration.vibrate(30);
        console.log(`🎮 Gesto: Teléfono plano`);
        onFlat();
        setTimeout(() => { wasFlat.current = false; }, 500);
      } else if (Math.abs(z) >= 0.8) {
        wasFlat.current = false;
      }
    });
    
    return () => {
      if (subscription.current) {
        subscription.current.remove();
        subscription.current = null;
      }
    };
  }, [enabled, isAvailable, threshold, timeout, onLeftTilt, onRightTilt, onFlat, vibrateOnGesture]);
  
  return { isAvailable };
};