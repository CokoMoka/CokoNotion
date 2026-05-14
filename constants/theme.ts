/**
 * Colores y temas para la app con estética gloomy bear
 */

interface ColorScheme {
  background: string;
  cardBackground: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  bearPrimary: string;
  bearSecondary: string;
  bearLight: string;
  bearSoft: string;
  bearShadow: string;
  bearAccent: string;
  iosBlue: string;
  iosGray: string;
  iosGreen: string;
  iosRed: string;
}

interface FontSet {
  sans: string;
  rounded: string;
  mono: string;
}

interface FontsType {
  ios: FontSet;
  android: FontSet;
  default: FontSet;
}

interface ShadowStyle {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

interface ShadowsType {
  small: ShadowStyle;
  medium: ShadowStyle;
  large: ShadowStyle;
  pink: ShadowStyle;
}

// Colores - con textos MÁS OSCUROS
export const Colors: {
  light: ColorScheme;
  dark: ColorScheme;
} = {
  light: {
    // Colores base
    background: 'rgba(255, 255, 255, 0.53)',
    cardBackground: '#ffffff',
    border: '#f5f5f5', // Un poco más oscuro para mejor contraste
    
    // Textos - MÁS OSCUROS
    text: '#000000', // Negro puro para máximo contraste
    textSecondary: '#2c2c2c', // Gris muy oscuro (antes era #666666)
    textMuted: '#4a4a4a', // Gris oscuro (antes era #999999)
    
    // Colores gloomy (rosas)
    bearPrimary: '#e6dee6', // COLORES PRINCIPALES
    bearSecondary: '#70626e', // Rosa más oscuro aún
    bearLight: '#e7dceb',
    bearSoft: '#dad2dc',
    bearShadow: '#817a80',
    bearAccent: '#dac5db',
    
    // iOS específicos
    iosBlue: '#007AFF',
    iosGray: '#8E8E93',
    iosGreen: '#34C759',
    iosRed: '#FF3B30',

  },
  dark: {
    // Modo oscuro
    background: '#47474770',
    cardBackground: '#000000',
    border: '#e4e4e4b2',
    
    text: '#ffffff',
    textSecondary: '#e0e0e0', // Más claro
    textMuted: '#b0b0b0', // Más claro
    
    bearPrimary: '#b0a2ab',
    bearSecondary: '#8f7c87',
    bearLight: '#c5c5c5',
    bearSoft: '#2a1a22',
    bearShadow: '#adb4c5',
    bearAccent: '#bcafbc',
    
    iosBlue: '#0A84FF',
    iosGray: '#98989E',
    iosGreen: '#30D158',
    iosRed: '#FF453A',
  },
};

// Fuentes
export const Fonts: FontsType = {
  ios: {
    sans: 'SFProText-Regular',
    rounded: 'SFProRounded-Regular',
    mono: 'SFMono-Regular',
  },
  android: {
    sans: 'Roboto',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    rounded: 'System',
    mono: 'monospace',
  },
};

export const getFontFamily = (
  platform: 'ios' | 'android' | 'web' | 'default' | string,
  type: 'sans' | 'rounded' | 'mono' = 'sans'
): string => {
  const plat = platform as keyof typeof Fonts;
  
  if (plat === 'ios' || plat === 'android' || plat === 'default') {
    const fontSet = Fonts[plat];
    if (type in fontSet) {
      return fontSet[type as keyof FontSet];
    }
  }
  
  return Fonts.default[type] || 'System';
};

export const Shadows: ShadowsType = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  pink: {
    shadowColor: '#b33b7e', // Rosa más oscuro para sombra
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
};

export interface ThemeType {
  Colors: typeof Colors;
  Fonts: typeof Fonts;
  Shadows: typeof Shadows;
  getFontFamily: typeof getFontFamily;
}

const theme: ThemeType = {
  Colors,
  Fonts,
  Shadows,
  getFontFamily,
};

export default theme;