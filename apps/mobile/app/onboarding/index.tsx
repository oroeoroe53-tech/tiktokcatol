import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { OnboardingScreen } from '../../components/onboarding/OnboardingScreen';

export default function WelcomeScreen() {
  const router = useRouter();
  return (
    <OnboardingScreen
      step={1}
      title="Faro"
      subtitle="Fe, comunidad y crecimiento espiritual en un feed que te ayuda a acercarte a Dios."
      footer={
        <View>
          <Button label="Comenzar" variant="accent" fullWidth onPress={() => router.push('/onboarding/objective')} />
          <Link href="/(auth)/login" style={styles.loginLink}>
            <Text style={styles.loginText}>Ya tengo una cuenta</Text>
          </Link>
        </View>
      }
    >
      <View style={styles.pillars}>
        {['Vídeo corto con propósito', 'Biblia y oración diaria', 'Camino de Fe personalizado', 'Comunidad católica global'].map(
          (item) => (
            <View key={item} style={styles.pillarRow}>
              <View style={styles.dot} />
              <Text style={styles.pillarText}>{item}</Text>
            </View>
          ),
        )}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  pillars: { gap: spacing.md },
  pillarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  pillarText: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, color: colors.white },
  loginLink: { alignSelf: 'center', marginTop: spacing.lg },
  loginText: { fontFamily: fontFamily.bodyMedium, color: 'rgba(255,255,255,0.8)', fontSize: fontSize.sm },
});
