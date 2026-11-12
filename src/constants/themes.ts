import { AestheticThemeId, BackgroundPattern, TypographyStyle } from '../types';

export interface ThemeConfig {
  id: AestheticThemeId;
  name: string;
  tagline: string;
  description: string;
  swatches: string[];
  recommendedSound: string;
  recommendedPattern: BackgroundPattern;
  light: {
    bg: string;
    card: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentLight: string;
  };
  dark: {
    bg: string;
    card: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentLight: string;
  };
}

export const THEMES: Record<AestheticThemeId, ThemeConfig> = {
  default: {
    id: 'default',
    name: 'Dayflow Slate',
    tagline: 'Precision Modern Obsidian',
    description: 'Clean deep slate architecture with high-clarity indigo and cyan neon accents.',
    swatches: ['#0f172a', '#1e293b', '#4f46e5', '#06b6d4', '#10b981'],
    recommendedSound: 'whitenoise',
    recommendedPattern: 'subtle-grid',
    light: {
      bg: '#f8fafc',
      card: '#ffffff',
      border: '#e2e8f0',
      text: '#0f172a',
      textMuted: '#64748b',
      accent: '#4f46e5',
      accentLight: '#e0e7ff',
    },
    dark: {
      bg: '#020617',
      card: '#0f172a',
      border: '#1e293b',
      text: '#f8fafc',
      textMuted: '#94a3b8',
      accent: '#6366f1',
      accentLight: '#312e81',
    },
  },
  nude: {
    id: 'nude',
    name: 'Warm Nude & Linen',
    tagline: 'Artisan Sand, Terracotta & Oat',
    description: 'Calming earthy tones reminiscent of sun-warmed clay, oat milk, raw linen, and espresso.',
    swatches: ['#28231F', '#3D352F', '#C86D51', '#D4A373', '#FAEDCD'],
    recommendedSound: 'cafe',
    recommendedPattern: 'dots',
    light: {
      bg: '#FAF7F2',
      card: '#FFFFFF',
      border: '#E8E1D8',
      text: '#2C2520',
      textMuted: '#8A7B70',
      accent: '#C86D51',
      accentLight: '#FBECE6',
    },
    dark: {
      bg: '#181513',
      card: '#24201D',
      border: '#3A332E',
      text: '#F5EFEB',
      textMuted: '#A8998D',
      accent: '#D47D64',
      accentLight: '#4A2A22',
    },
  },
  monotonic: {
    id: 'monotonic',
    name: 'Monotonic Noir',
    tagline: 'Brutalist Architectural Monochrome',
    description: 'Pure stark black, crisp editorial white, and stainless steel with zero distractions.',
    swatches: ['#050505', '#161616', '#2A2A2A', '#888888', '#FFFFFF'],
    recommendedSound: 'brownnoise',
    recommendedPattern: 'subtle-grid',
    light: {
      bg: '#F9F9F9',
      card: '#FFFFFF',
      border: '#D8D8D8',
      text: '#000000',
      textMuted: '#666666',
      accent: '#111111',
      accentLight: '#E8E8E8',
    },
    dark: {
      bg: '#050505',
      card: '#121212',
      border: '#242424',
      text: '#FFFFFF',
      textMuted: '#888888',
      accent: '#E0E0E0',
      accentLight: '#262626',
    },
  },
  tropical: {
    id: 'tropical',
    name: 'Lush Tropical',
    tagline: 'Rainforest Canopy & Island Glow',
    description: 'Vibrant botanical emeralds, sea glass teal, and ripe island mango highlights.',
    swatches: ['#071A14', '#113328', '#10B981', '#14B8A6', '#F59E0B'],
    recommendedSound: 'rain',
    recommendedPattern: 'mesh',
    light: {
      bg: '#F2F8F5',
      card: '#FFFFFF',
      border: '#CFE6DC',
      text: '#09261D',
      textMuted: '#4F7D6E',
      accent: '#059669',
      accentLight: '#D1FAE5',
    },
    dark: {
      bg: '#071612',
      card: '#0E2820',
      border: '#1B473A',
      text: '#ECFDF5',
      textMuted: '#84B8A6',
      accent: '#10B981',
      accentLight: '#064E3B',
    },
  },
  city_landscape: {
    id: 'city_landscape',
    name: 'City Skyline at Dusk',
    tagline: 'Metropolitan Midnight & Neon Horizon',
    description: 'Electric dusk violet, deep twilight navy, and glowing golden skyscraper beacon lights.',
    swatches: ['#0A0F1D', '#131C31', '#8B5CF6', '#F59E0B', '#06B6D4'],
    recommendedSound: 'lofi',
    recommendedPattern: 'glow',
    light: {
      bg: '#F3F5FA',
      card: '#FFFFFF',
      border: '#D8E0F0',
      text: '#0C1326',
      textMuted: '#58678A',
      accent: '#7C3AED',
      accentLight: '#EDE9FE',
    },
    dark: {
      bg: '#080C18',
      card: '#11182B',
      border: '#1F2C4C',
      text: '#F1F5F9',
      textMuted: '#8696BD',
      accent: '#8B5CF6',
      accentLight: '#2E1065',
    },
  },
  pastel: {
    id: 'pastel',
    name: 'Sweet Pastel & Matcha',
    tagline: 'Marshmallow Cloud & Lavender Mist',
    description: 'Soft dreamy lilac, gentle blush peach, matcha milk, and soothing cloud blue.',
    swatches: ['#171324', '#261F38', '#F472B6', '#A78BFA', '#86EFAC'],
    recommendedSound: 'ambient_pad',
    recommendedPattern: 'dots',
    light: {
      bg: '#FAF7FD',
      card: '#FFFFFF',
      border: '#E8DEF3',
      text: '#281E38',
      textMuted: '#826E9E',
      accent: '#A855F7',
      accentLight: '#F3E8FF',
    },
    dark: {
      bg: '#141021',
      card: '#1F1833',
      border: '#352B52',
      text: '#F8F6FD',
      textMuted: '#B2A3D1',
      accent: '#C084FC',
      accentLight: '#3B1F69',
    },
  },
  nordic: {
    id: 'nordic',
    name: 'Nordic Frost',
    tagline: 'Glacial Fjord & Polar Pine',
    description: 'Crisp scandinavian sea stone, arctic frost cyan, and muted silver pine needle.',
    swatches: ['#0A121A', '#13212E', '#38BDF8', '#34D399', '#94A3B8'],
    recommendedSound: 'ocean',
    recommendedPattern: 'subtle-grid',
    light: {
      bg: '#F4F7F9',
      card: '#FFFFFF',
      border: '#D5DFE6',
      text: '#0F1E29',
      textMuted: '#566B7A',
      accent: '#0284C7',
      accentLight: '#E0F2FE',
    },
    dark: {
      bg: '#081017',
      card: '#101D28',
      border: '#1C3144',
      text: '#F0F6FA',
      textMuted: '#86A1B5',
      accent: '#38BDF8',
      accentLight: '#0C4A6E',
    },
  },
};
