import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, fontSize, radius, spacing } from '../theme';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger' | 'demo';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
}

export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.base, toneStyles[tone]]}>
      <Text style={[styles.label, toneTextStyles[tone]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  label: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs },
});

const toneStyles = StyleSheet.create({
  neutral: { backgroundColor: colors.surfaceAlt },
  accent: { backgroundColor: colors.accentSoft },
  success: { backgroundColor: colors.successSoft },
  danger: { backgroundColor: colors.dangerSoft },
  demo: { backgroundColor: colors.ink },
});

const toneTextStyles = StyleSheet.create({
  neutral: { color: colors.textSecondary },
  accent: { color: colors.textOnAccent },
  success: { color: colors.success },
  danger: { color: colors.danger },
  demo: { color: colors.accentSoft },
});
