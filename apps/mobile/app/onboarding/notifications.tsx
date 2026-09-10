import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { OnboardingScreen } from '../../components/onboarding/OnboardingScreen';
import { useOnboardingStore } from '../../stores/onboarding-store';

const OPTIONS: { key: 'DAILY' | 'FEW_TIMES_WEEK' | 'WEEKLY' | 'NEVER'; label: string; description: string }[] = [
  { key: 'DAILY', label: 'Cada día', description: 'Un recordatorio diario para rezar y crecer en tu fe.' },
  { key: 'FEW_TIMES_WEEK', label: 'Varias veces por semana', description: 'El equilibrio recomendado.' },
  { key: 'WEEKLY', label: 'Una vez por semana', description: 'Un recordatorio semanal.' },
  { key: 'NEVER', label: 'Prefiero no recibir recordatorios', description: 'Puedes activarlos luego en Ajustes.' },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const { notificationFrequency, setNotificationFrequency } = useOnboardingStore();

  return (
    <OnboardingScreen
      step={4}
      title="¿Con qué frecuencia quieres recordatorios?"
      subtitle="Nunca usaremos notificaciones para presionarte, solo para acompañarte."
      footer={<Button label="Continuar" variant="accent" fullWidth onPress={() => router.push('/onboarding/register')} />}
    >
      <View style={{ gap: spacing.sm }}>
        {OPTIONS.map((option) => {
          const selected = notificationFrequency === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setNotificationFrequency(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
              <Text style={styles.description}>{option.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  option: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  optionSelected: { backgroundColor: 'rgba(245,166,35,0.15)', borderColor: colors.accent },
  label: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.base, color: colors.white },
  labelSelected: { color: colors.accent },
  description: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
});
