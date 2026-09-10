export * from './colors';
export * from './typography';
export * from './spacing';

import { colors } from './colors';
import { fontFamily, fontSize, lineHeight } from './typography';
import { spacing, radius, shadow } from './spacing';

export const theme = {
  colors,
  fontFamily,
  fontSize,
  lineHeight,
  spacing,
  radius,
  shadow,
} as const;

export type Theme = typeof theme;
