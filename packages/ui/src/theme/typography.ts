/**
 * Manrope (UI/cuerpo) + Fraunces (titulares/citas) — ver docs/PLANNING.md §3.
 * Las familias se cargan en la app móvil vía expo-font; aquí solo se define la escala.
 */
export const fontFamily = {
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  display: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
} as const;

export const lineHeight = {
  xs: 16,
  sm: 20,
  base: 24,
  lg: 26,
  xl: 30,
  '2xl': 36,
  '3xl': 42,
} as const;
