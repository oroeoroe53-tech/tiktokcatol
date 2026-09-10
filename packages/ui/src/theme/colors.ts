/**
 * Paleta de marca de Faro (ver docs/PLANNING.md §3).
 * Concepto: amanecer — de la noche (índigo) a la luz (ámbar cálido).
 */
export const colors = {
  ink: '#14132B',
  primary: '#4338CA',
  primaryDark: '#2E2570',
  primarySoft: '#E4E1FB',
  accent: '#F5A623',
  accentSoft: '#FFE3B3',
  success: '#4CAF7D',
  successSoft: '#DEF3E7',
  danger: '#E5484D',
  dangerSoft: '#FBE1E2',
  bg: '#FAF9FF',
  surface: '#FFFFFF',
  surfaceAlt: '#F1EFFB',
  border: '#E6E3F5',
  textPrimary: '#1A1830',
  textSecondary: '#6B6790',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#14132B',
  white: '#FFFFFF',
  black: '#000000',
} as const;

export const gradients = {
  dawn: ['#14132B', '#4338CA', '#F5A623'] as const,
  primary: ['#4338CA', '#2E2570'] as const,
};

export type ColorToken = keyof typeof colors;
