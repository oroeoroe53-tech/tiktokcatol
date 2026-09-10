import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fontFamily, fontSize, spacing } from '@faro/ui';

interface OnboardingScreenProps {
  step: number; // 1-5
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

const TOTAL_STEPS = 5;

export function OnboardingScreen({ step, title, subtitle, children, footer }: OnboardingScreenProps) {
  return (
    <LinearGradient colors={[colors.ink, colors.primaryDark]} style={styles.gradient}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i < step && styles.dotActive]} />
          ))}
        </View>
        <View style={styles.body}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.content}>{children}</View>
        </View>
        <View style={styles.footer}>{footer}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: spacing.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: spacing.md },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: colors.accent },
  body: { flex: 1, justifyContent: 'center' },
  title: {
    fontFamily: fontFamily.display,
    fontSize: fontSize['3xl'],
    color: colors.white,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: spacing.xl,
  },
  content: { marginTop: spacing.lg },
  footer: { paddingBottom: spacing.xl },
});
