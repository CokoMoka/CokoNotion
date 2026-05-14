// hooks/useCompass.ts
import { useEffect, useState } from 'react';
import { Magnetometer } from 'expo-sensors';

export const useCompass = () => {
  const [heading, setHeading] = useState(0);
  const [direction, setDirection] = useState('N');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Obtener la dirección cardinal
  const getDirectionFromHeading = (deg: number) => {
    if (deg > 337.5 || deg <= 22.5) return 'N';
    if (deg > 22.5 && deg <= 67.5) return 'NE';
    if (deg > 67.5 && deg <= 112.5) return 'E';
    if (deg > 112.5 && deg <= 157.5) return 'SE';
    if (deg > 157.5 && deg <= 202.5) return 'S';
    if (deg > 202.5 && deg <= 247.5) return 'SW';
    if (deg > 247.5 && deg <= 292.5) return 'W';
    return 'NW';
  };

  useEffect(() => {
    let subscription: any = null;
    let lastValue = { x: 0, y: 0, z: 0 };
    let samples: number[] = [];

    const setupCompass = async () => {
      const available = await Magnetometer.isAvailableAsync();
      if (!available) {
        setIsAvailable(false);
        console.log('⚠️ Magnetómetro no disponible');
        return;
      }

      Magnetometer.setUpdateInterval(100);
      
      subscription = Magnetometer.addListener(data => {
        // Detectar si hay mucha interferencia
        const deltaX = Math.abs(data.x - lastValue.x);
        const deltaY = Math.abs(data.y - lastValue.y);
        const deltaZ = Math.abs(data.z - lastValue.z);
        const change = deltaX + deltaY + deltaZ;
        
        if (change > 10) {
          setIsCalibrating(true);
        } else {
          setIsCalibrating(false);
        }
        
        // Calcular ángulo
        let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
        if (angle < 0) angle = 360 + angle;
        
        // Suavizar el ángulo (promedio móvil)
        samples.push(angle);
        if (samples.length > 10) samples.shift();
        const avgAngle = samples.reduce((a, b) => a + b, 0) / samples.length;
        
        setHeading(avgAngle);
        setDirection(getDirectionFromHeading(avgAngle));
        
        lastValue = data;
      });
    };

    setupCompass();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { heading, direction, isAvailable, isCalibrating };
};