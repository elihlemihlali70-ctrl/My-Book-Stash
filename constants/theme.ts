import { Platform } from 'react-native';

/** Shared Book Stash design tokens used across every screen. */
export const Palette = {
  brand: '#40533C',
  brandDeep: '#334631',
  brandDark: '#263329',
  brandLight: '#E7E6D9',
  page: '#F3EBDD',
  surface: '#FFFCF4',
  surfaceRaised: '#FFFDF8',
  surfaceWarm: '#F1EAD9',
  text: '#30362C',
  textOnDark: '#ECE6D5',
  muted: '#777466',
  mutedDark: '#5F6154',
  mutedStrong: '#898575',
  mutedLight: '#858273',
  border: '#E3DAC8',
  borderStrong: '#DED5C3',
  accent: '#B79A62',
  accentDeep: '#92784C',
  accentWarm: '#D97706',
  accentSoft: '#D38B55',
  accentPale: '#E7B99A',
  mutedDeep: '#656656',
  brown: '#7E4827',
  bookTerracotta: '#6B3424',
  bookSage: '#5B7E5E',
  olive: '#8A9271',
  oliveDark: '#727B54',
  success: '#A9B594',
  danger: '#A65F52',
  dangerStrong: '#B42318',
  dangerSoft: '#FEF2F2',
  favorite: '#DC2626',
  placeholder: '#999999',
  icon: '#888888',
  camera: '#20291F',
  black: '#000000',
  wash: 'rgba(255, 249, 233, 0.68)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
} as const;

export const Radii = {
  sm: 9,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
} as const;

export const TypeScale = {
  caption: 12,
  body: 14,
  section: 18,
  title: 28,
  display: 34,
} as const;

export const Colors = {
  light: {
    text: Palette.text,
    background: Palette.page,
    tint: Palette.brand,
    icon: Palette.muted,
    tabIconDefault: Palette.muted,
    tabIconSelected: Palette.brand,
  },
  dark: {
    text: Palette.page,
    background: Palette.brandDark,
    tint: Palette.page,
    icon: '#A7A48B',
    tabIconDefault: '#A7A48B',
    tabIconSelected: Palette.page,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
