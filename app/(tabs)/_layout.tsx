import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';

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
        tabBarLabel: () => null,
      }}
    >
      {/* INICIO */}
      <Tabs.Screen
        name="Main"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="home" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* NOTAS */}
      <Tabs.Screen
        name="NotasN"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="pencil" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* FLASHCARDS */}
      <Tabs.Screen
        name="FeedFlashCards"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="albums" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* TEMPORIZADOR */}
      <Tabs.Screen
        name="PomSetup"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="timer" color={color} size={size} focused={focused} iconSet="MaterialIcons" />
          ),
        }}
      />
      {/* ESTADÍSTICAS */}
      <Tabs.Screen
        name="EstadisticasN"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="stats-chart" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* MAPA */}
      <Tabs.Screen
        name="Mapa"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="map" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* PERFIL */}
      <Tabs.Screen
        name="ProfileN"
        options={{
          title: '',
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon name="person" color={color} size={size} focused={focused} />
          ),
        }}
      />
      {/* ========== PANTALLAS OCULTAS ========== */}
      <Tabs.Screen name="NuevaNota" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="NotaEj" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="StudyScreen" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="NewFlashcardSet" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="EditSet" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="Timer" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="FlashCards" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="Pruebas" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="am" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="Notas" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="Stats" options={{ href: null, tabBarIcon: () => null }} />
      <Tabs.Screen name="Pomodoro" options={{ href: null, tabBarIcon: () => null }} />
    </Tabs>
  );
}