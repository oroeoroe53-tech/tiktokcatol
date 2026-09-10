import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../theme';

export interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  color?: string;
  trackColor?: string;
}

export function ProgressBar({ progress, height = 8, color = colors.accent, trackColor = colors.border }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: trackColor }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped}%`, height, borderRadius: height / 2, backgroundColor: color },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', overflow: 'hidden' },
  fill: { borderRadius: radius.pill },
});
