import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentCategory } from '@faro/types';
import { Card, ScreenHeader, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';

const QUICK_ACCESS: { icon: keyof typeof Ionicons.glyphMap; label: string; route: string; tint: string }[] = [
  { icon: 'flame', label: 'Oración', route: '/prayer', tint: colors.accent },
  { icon: 'book', label: 'Biblia', route: '/bible', tint: colors.primary },
  { icon: 'star', label: 'Santo del día', route: '/saints', tint: colors.success },
];

const CATEGORY_LABELS: Record<string, string> = {
  [ContentCategory.PRAYER]: 'Oración',
  [ContentCategory.BIBLE]: 'Biblia',
  [ContentCategory.SAINTS]: 'Santos',
  [ContentCategory.JESUS]: 'Jesús',
  [ContentCategory.FORMATION]: 'Formación',
  [ContentCategory.TESTIMONY]: 'Testimonios',
  [ContentCategory.SACRAMENTS]: 'Sacramentos',
  [ContentCategory.YOUTH]: 'Jóvenes',
  [ContentCategory.FAMILY]: 'Familia',
  [ContentCategory.MUSIC]: 'Música',
  [ContentCategory.CHURCH_HISTORY]: 'Historia de la Iglesia',
};

export default function DiscoverScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Descubrir" subtitle="Explora contenido católico por categoría" />

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar creadores, hashtags, versículos…"
            placeholderTextColor={colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.quickAccessRow}>
          {QUICK_ACCESS.map((item) => (
            <TouchableOpacity key={item.route} onPress={() => router.push(item.route as any)} style={{ flex: 1 }}>
              <Card style={styles.quickAccessCard}>
                <View style={[styles.quickAccessIcon, { backgroundColor: item.tint }]}>
                  <Ionicons name={item.icon} size={20} color={colors.white} />
                </View>
                <Text style={styles.quickAccessLabel}>{item.label}</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Categorías</Text>
        <View style={styles.grid}>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <TouchableOpacity key={key} style={styles.categoryTile} onPress={() => router.push(`/(tabs)`)}>
              <Text style={styles.categoryLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  searchInput: { flex: 1, fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textPrimary },
  quickAccessRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  quickAccessCard: { alignItems: 'center', gap: spacing.sm },
  quickAccessIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  quickAccessLabel: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, color: colors.textPrimary },
  sectionTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing['3xl'] },
  categoryTile: {
    width: '47%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  categoryLabel: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, color: colors.textPrimary },
});
