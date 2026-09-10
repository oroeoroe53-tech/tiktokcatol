import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FaithPathObjective } from '@faro/types';
import { Button, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { OnboardingScreen } from '../../components/onboarding/OnboardingScreen';
import { useOnboardingStore } from '../../stores/onboarding-store';

const OBJECTIVES: { key: FaithPathObjective; label: string }[] = [
  { key: FaithPathObjective.GET_CLOSER_TO_JESUS, label: 'Acercarme a Jesús' },
  { key: FaithPathObjective.START_PRAYING, label: 'Empezar a rezar' },
  { key: FaithPathObjective.KNOW_THE_BIBLE, label: 'Conocer la Biblia' },
  { key: FaithPathObjective.KNOW_THE_SAINTS, label: 'Conocer a los santos' },
  { key: FaithPathObjective.LEARN_CATHOLICISM, label: 'Aprender sobre el catolicismo' },
  { key: FaithPathObjective.RETURN_TO_CHURCH, label: 'Volver a la Iglesia' },
  { key: FaithPathObjective.IMPROVE_SPIRITUAL_LIFE, label: 'Mejorar mi vida espiritual' },
  { key: FaithPathObjective.FIND_COMMUNITY, label: 'Encontrar comunidad' },
  { key: FaithPathObjective.LIVE_FAITH_AS_FAMILY, label: 'Vivir mi fe en familia' },
];

export default function ObjectiveScreen() {
  const router = useRouter();
  const { objective, setObjective } = useOnboardingStore();

  return (
    <OnboardingScreen
      step={2}
      title="¿Qué buscas?"
      subtitle="Elige lo que más resuene contigo ahora mismo."
      footer={
        <Button
          label="Continuar"
          variant="accent"
          fullWidth
          disabled={!objective}
          onPress={() => router.push('/onboarding/interests')}
        />
      }
    >
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {OBJECTIVES.map((item) => {
          const selected = objective === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setObjective(item.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 420 },
  option: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  optionText: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, color: colors.white },
  optionTextSelected: { color: colors.textOnAccent },
});
