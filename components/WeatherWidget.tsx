// components/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';

// 🔥 Reemplaza con tu API Key de OpenWeatherMap
// Regístrate gratis en https://home.openweathermap.org/users/sign_up
const API_KEY = 'c4a9bec39da862558ce116730466a4c1';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

interface WeatherData {
  temp: number;
  feelsLike: number;
  humidity: number;
  condition: string;
  icon: string;
  cityName: string;
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    getWeather();
  }, []);

  const getWeather = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 1️⃣ Solicitar permisos de ubicación
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setError('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      // 2️⃣ Obtener ubicación actual
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      // 3️⃣ Consultar API de OpenWeatherMap
      const response = await axios.get(BASE_URL, {
        params: {
          lat: latitude,
          lon: longitude,
          appid: API_KEY,
          units: 'metric', // Para temperatura en Celsius
          lang: 'es', // Para descripciones en español
        },
      });

      // 4️⃣ Procesar datos
      const data = response.data;
      setWeather({
        temp: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        condition: data.weather[0].description,
        icon: getWeatherIcon(data.weather[0].icon),
        cityName: data.name,
      });
    } catch (err) {
      console.error('Error al obtener clima:', err);
      setError('No se pudo cargar el clima');
    } finally {
      setLoading(false);
    }
  };

  // Función para mapear íconos de OpenWeather a emojis
  const getWeatherIcon = (iconCode: string): string => {
    const iconMap: { [key: string]: string } = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️',
    };
    return iconMap[iconCode] || '🌡️';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="small" color="#df96c0" />
          <Text style={styles.loadingText}>Cargando clima...</Text>
        </View>
      </View>
    );
  }

  if (error && permissionDenied) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContent}>
          <Text style={styles.errorIcon}>📍</Text>
          <Text style={styles.errorText}>Permiso de ubicación</Text>
          <Text style={styles.errorSubtext}>Actívalo para ver el clima local</Text>
        </View>
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={getWeather} style={styles.retryContent}>
          <Text style={styles.retryIcon}>↻</Text>
          <Text style={styles.retryText}>Toca para reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weatherCard}>
        {/* Ciudad y temperatura principal */}
        <View style={styles.mainRow}>
          <View>
            <Text style={styles.cityName}>{weather.cityName}</Text>
            <Text style={styles.condition}>{weather.condition}</Text>
          </View>
          <View style={styles.tempContainer}>
            <Text style={styles.tempIcon}>{weather.icon}</Text>
            <Text style={styles.temperature}>{weather.temp}°C</Text>
          </View>
        </View>

        {/* Detalles adicionales */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>🌡️</Text>
            <Text style={styles.detailLabel}>Sensación</Text>
            <Text style={styles.detailValue}>{weather.feelsLike}°C</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailIcon}>💧</Text>
            <Text style={styles.detailLabel}>Humedad</Text>
            <Text style={styles.detailValue}>{weather.humidity}%</Text>
          </View>
        </View>

        {/* Actualizar manualmente */}
        <TouchableOpacity onPress={getWeather} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻ Actualizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 10,
  },
  weatherCard: {
    backgroundColor: 'rgba(42, 47, 52, 0.95)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#343a40',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cityName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  condition: {
    fontSize: 16,
    color: '#b5b5b5',
    marginTop: 4,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tempIcon: {
    fontSize: 35,
  },
  temperature: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#df96c0',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 5,
    borderTopColor: '#343a40',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 50,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 25,
    color: '#888888',
  },
  detailValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  refreshButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  refreshText: {
    fontSize: 12,
    color: '#b6b6b6',
  },
  loadingContent: {
    backgroundColor: 'rgba(42, 47, 52, 0.95)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#b5b5b5',
    fontSize: 14,
  },
  errorContent: {
    backgroundColor: 'rgba(42, 47, 52, 0.95)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorSubtext: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
  },
  retryContent: {
    backgroundColor: 'rgba(42, 47, 52, 0.95)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  retryIcon: {
    fontSize: 20,
  },
  retryText: {
    color: '#df96c0',
    fontSize: 14,
  },
});