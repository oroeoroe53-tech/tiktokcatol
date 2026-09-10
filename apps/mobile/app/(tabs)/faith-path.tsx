import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FaithPathObjective } from '@faro/types';
import { Button, Card, ProgressBar, ScreenHeader, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { useCompleteFaithPathStep, useFaithPath, useSelectFaithPathObjective } from '../../hooks/useFaithPath';
import { useAuthStore } from '../../stores/auth-store';
import { ApiError } from '../../services/api-client';

const OBJECTIVES: { key: FaithPathObjective; label: string }[] = [
  { key: FaithPathObjective.GET_CLOSER_TO_JESUS, label: 'Acercarme a Jesús' },
  { key: FaithPathObjective.START_PRAYING, label: 'Empezar a rezar' },
  { key: FaithPathObjective.KNOW_THE_BIBLE, label: 'Conocer la Biblia' },
  { key: FaithPathObjective.KNOW_THE_SAINTS, label: 'Conocer a los santos' },
  { key: FaithPathObjective.RETURN_TO_CHURCH, label: 'Volver a la Iglesia' },
];

export default function FaithPathScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, error, refetch } = useFaithPath();
  const selectObjective = useSelectFaithPathObjective();
  const completeStep = useCompleteFaithPathStep();

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Camino de Fe" />
        <View style={styles.center}>
          <Text style={styles.helperText}>Inicia sesión para seguir tu Camino de Fe personalizado.</Text>
          <Button label="Iniciar sesión" onPress={() => router.push('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  const needsObjective = error instanceof ApiError && error.status === 400;

  if (needsObjective || (!isLoading && !data)) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Camino de Fe" subtitle="Elige un objetivo para empezar" />
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
          {OBJECTIVES.map((item) => (
            <TouchableOpacity
              key={item.key}
              onPress={async () => {
                await selectObjective.mutateAsync(item.key);
                refetch();
              }}
            >
              <Card>
                <Text style={styles.objectiveLabel}>{item.label}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Camino de Fe" subtitle={data ? `Día ${data.currentStepOrder} de ${data.totalSteps}` : undefined} />
      {data && (
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          <ProgressBar progress={data.progressPercent} />
        </View>
      )}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {data?.steps.map((step) => (
          <Card key={step.id} style={step.completed ? styles.stepCompleted : undefined}>
            <View style={styles.stepRow}>
              <View style={[styles.stepIcon, step.completed && styles.stepIconDone]}>
                <Ionicons name={step.completed ? 'checkmark' : 'ellipse-outline'} size={16} color={step.completed ? colors.white : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
            {!step.completed && step.order === data.currentStepOrder && (
              <Button
                label="Marcar como completado"
                variant="outline"
                loading={completeStep.isPending}
                onPress={() => completeStep.mutate(step.id)}
              />
            )}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  helperText: { fontFamily: fontFamily.body, color: colors.textSecondary, textAlign: 'center' },
  objectiveLabel: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, color: colors.textPrimary },
  stepRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: colors.success, borderColor: colors.success },
  stepTitle: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.base, color: colors.textPrimary },
  stepDescription: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  stepCompleted: { opacity: 0.6 },
});
