import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { PrayerCategoryKey } from '@faro/types';
import { Avatar, Badge, Button, Card, ScreenHeader, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import {
  useCompletePrayer,
  useCreateIntention,
  useDailyPrayer,
  usePrayerIntentions,
  usePrayers,
  useSupportIntention,
  useToggleFavoritePrayer,
} from '../../hooks/usePrayer';
import { useAuthStore } from '../../stores/auth-store';

const CATEGORY_LABELS: Record<string, string> = {
  [PrayerCategoryKey.MORNING]: 'Mañana',
  [PrayerCategoryKey.NIGHT]: 'Noche',
  [PrayerCategoryKey.ROSARY]: 'Rosario',
  [PrayerCategoryKey.BEFORE_SLEEP]: 'Antes de dormir',
  [PrayerCategoryKey.GRATITUDE]: 'Gratitud',
  [PrayerCategoryKey.FORGIVENESS]: 'Perdón',
  [PrayerCategoryKey.FAMILY]: 'Familia',
  [PrayerCategoryKey.SICKNESS]: 'Enfermedad',
  [PrayerCategoryKey.DIFFICULT_TIMES]: 'Momentos difíciles',
  [PrayerCategoryKey.THANKSGIVING]: 'Acción de gracias',
};

export default function PrayerScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const daily = useDailyPrayer();
  const prayers = usePrayers();
  const intentions = usePrayerIntentions();
  const toggleFavorite = useToggleFavoritePrayer();
  const completePrayer = useCompletePrayer();
  const createIntention = useCreateIntention();
  const supportIntention = useSupportIntention();
  const [intentionText, setIntentionText] = useState('');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <ScreenHeader title="Oración" subtitle="Tu momento diario con Dios" />
        </View>

        {daily.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : daily.data ? (
          <Card>
            <Badge label={CATEGORY_LABELS[daily.data.category] ?? daily.data.category} tone="accent" />
            <Text style={styles.prayerTitle}>{daily.data.title}</Text>
            <Text style={styles.prayerContent}>{daily.data.content}</Text>
            <View style={styles.rowGap}>
              <Button
                label={daily.data.isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                variant="outline"
                onPress={() => toggleFavorite.mutate({ prayerId: daily.data!.id, favorite: !daily.data!.isFavorite })}
              />
              <Button
                label="He rezado esta oración"
                variant="accent"
                onPress={() => user && completePrayer.mutate(daily.data!.id)}
              />
            </View>
          </Card>
        ) : null}

        <Text style={styles.sectionTitle}>Biblioteca de oración</Text>
        {prayers.data?.map((prayer) => (
          <Card key={prayer.id} style={{ marginBottom: spacing.sm }}>
            <Text style={styles.libraryTitle}>{prayer.title}</Text>
            <Text style={styles.libraryCategory}>{CATEGORY_LABELS[prayer.category] ?? prayer.category}</Text>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Intenciones de oración</Text>
        {user && (
          <View style={styles.intentionForm}>
            <TextInput
              style={styles.intentionInput}
              placeholder="Comparte tu intención de oración…"
              value={intentionText}
              onChangeText={setIntentionText}
              multiline
            />
            <Button
              label="Publicar intención"
              variant="outline"
              loading={createIntention.isPending}
              disabled={!intentionText.trim()}
              onPress={async () => {
                await createIntention.mutateAsync({ text: intentionText.trim(), isAnonymous: false });
                setIntentionText('');
              }}
            />
          </View>
        )}
        {intentions.data?.items.map((intention) => (
          <Card key={intention.id} style={{ marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              {intention.author ? (
                <Avatar uri={intention.author.avatarUrl} name={intention.author.displayName} size={28} />
              ) : (
                <Ionicons name="person-circle-outline" size={28} color={colors.textSecondary} />
              )}
              <Text style={styles.intentionAuthor}>{intention.author?.displayName ?? 'Anónimo'}</Text>
            </View>
            <Text style={styles.intentionText}>{intention.text}</Text>
            <TouchableOpacity
              style={styles.prayButton}
              onPress={() =>
                user &&
                supportIntention.mutate({ intentionId: intention.id, praying: !intention.viewerIsPrayingFor })
              }
            >
              <Ionicons
                name={intention.viewerIsPrayingFor ? 'heart' : 'heart-outline'}
                size={16}
                color={intention.viewerIsPrayingFor ? colors.danger : colors.textSecondary}
              />
              <Text style={styles.prayButtonText}>Rezaré por ti · {intention.prayingForCount}</Text>
            </TouchableOpacity>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  prayerTitle: { fontFamily: fontFamily.display, fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm },
  prayerContent: { fontFamily: fontFamily.body, fontSize: fontSize.base, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 24 },
  rowGap: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' },
  sectionTitle: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.lg, color: colors.textPrimary },
  libraryTitle: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.base, color: colors.textPrimary },
  libraryCategory: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  intentionForm: { gap: spacing.sm },
  intentionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontFamily: fontFamily.body,
    minHeight: 70,
    backgroundColor: colors.surface,
  },
  intentionAuthor: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.sm, color: colors.textPrimary },
  intentionText: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textPrimary },
  prayButton: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  prayButtonText: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs, color: colors.textSecondary },
});
