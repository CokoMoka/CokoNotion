// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Platform, Animated } from 'react-native';
import { useRef, useEffect } from 'react';

// Componente para icono animado
const AnimatedIcon = ({ 
  name, 
  color, 
  size, 
  focused,
  iconSet = 'Ionicons' 
}: { 
  name: string; 
  color: string; 
  size: number; 
  focused: boolean;
  iconSet?: 'Ionicons' | 'MaterialIcons' | 'FontAwesome5' | 'Feather';
}) => {
  const scaleAnim = useRef(new Animated.Value(focused ? 1.2 : 1)).current;
  
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: focused ? 1.2 : 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  }, [focused]);
  
  const iconSize = focused ? size + 6 : size;
  
  const getIcon = () => {
    const iconProps = { name, color, size: iconSize };
    
    switch (iconSet) {
      case 'MaterialIcons':
        return <MaterialIcons {...iconProps} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...iconProps} />;
      case 'Feather':
        return <Feather {...iconProps} />;
      default:
        return <Ionicons {...iconProps} />;
    }
  };
  
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {getIcon()}
    </Animated.View>
  );
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#df96c0',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1a1a1a',
          borderTopColor: '#333',
          height: Platform.OS === 'ios' ? 70 : 60,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
        },
        headerShown: false,
        tabBarLabel: () => null, // ✅ Elimina el texto
      }}
    >
      {/* Inicio */}
      <Tabs.Screen
        name="Main"
        options={{
          title: '', // Título vacío
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      
      
      
      {/* Flashcards */}
      <Tabs.Screen
        name="FlashCards"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="albums" color={color} size={size} focused={focused} />
          ),
        }}
      />
      
      {/* Temporizador */}
      <Tabs.Screen
        name="Timer"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="timer" color={color} size={size} focused={focused} />
          ),
        }}
      />
      
      {/* Notas */}
      <Tabs.Screen
        name="Notas"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="document-text" color={color} size={size} focused={focused} />
          ),
        }}
      />
      
      {/* Estadísticas */}
      <Tabs.Screen
        name="Stats"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="stats-chart" color={color} size={size} focused={focused} />
          ),
        }}
      />
      
      
      
      {/* Mapa */}
      <Tabs.Screen
        name="Mapa"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="Mapa" color={color} size={size} focused={focused} />
          ),
        }}
      />

      {/* Perfil */}
      <Tabs.Screen
        name="Perfil"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
      
      {/* Pantallas ocultas */}
      <Tabs.Screen name="NuevaNota" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="NotaEj" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="StudyScreen" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="NewFlashcardSet" options={{ href: null, tabBarIcon: () => null }} />
    </Tabs>
  );
}