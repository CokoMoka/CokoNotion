// hooks/useShake.ts
import { useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

interface ShakeOptions {
  threshold?: number;
  timeout?: number;
  enabled?: boolean;
  onShake?: () => void;
}

export const useShake = (options: ShakeOptions = {}) => {
  const { threshold = 1.5, timeout = 1000, enabled = true, onShake } = options;
  
  const lastShakeTime = useRef(0);
  const subscription = useRef<any>(null);
  const onShakeRef = useRef(onShake);
  
  useEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled) {
      console.log('⏸️ Shake deshabilitado');
      return;
    }
    
    console.log('✅ Shake habilitado - Escuchando acelerómetro...');
    
    let lastX = 0, lastY = 0, lastZ = 0;
    
    Accelerometer.setUpdateInterval(100);
    
    subscription.current = Accelerometer.addListener(data => {
      const { x, y, z } = data;
      
      const deltaX = Math.abs(x - lastX);
      const deltaY = Math.abs(y - lastY);
      const deltaZ = Math.abs(z - lastZ);
      const totalDelta = deltaX + deltaY + deltaZ;
      
      if (totalDelta > threshold) {
        const now = Date.now();
        if (now - lastShakeTime.current > timeout) {
          lastShakeTime.current = now;
          console.log(`🎯 Agitón detectado! Delta: ${totalDelta.toFixed(2)}`);
          if (onShakeRef.current) {
            onShakeRef.current();
          }
        }
      }
      
      lastX = x;
      lastY = y;
      lastZ = z;
    });
    
    return () => {
      console.log('🔴 Limpiando suscripción del acelerómetro');
      if (subscription.current) {
        subscription.current.remove();
        subscription.current = null;
      }
    };
  }, [threshold, timeout, enabled]);
  
  return {};
};