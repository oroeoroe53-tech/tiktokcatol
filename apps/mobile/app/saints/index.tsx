import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Badge, Card, ScreenHeader, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { useSaintOfTheDay } from '../../hooks/useBible';

interface SaintOfTheDay {
  id: string;
  name: string;
  imageUrl: string | null;
  shortBio: string;
  biography: string;
  virtues: string[];
}

export default function SaintsScreen() {
  const router = useRouter();
  const { data, isLoading } = useSaintOfTheDay();
  const saint = data as SaintOfTheDay | null | undefined;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <ScreenHeader title="Santo del día" />
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : saint ? (
          <Card>
            {saint.imageUrl && <Image source={{ uri: saint.imageUrl }} style={styles.image} />}
            <Text style={styles.name}>{saint.name}</Text>
            <Text style={styles.bio}>{saint.shortBio}</Text>
            <View style={styles.virtues}>
              {saint.virtues.map((virtue) => (
                <Badge key={virtue} label={virtue} tone="success" />
              ))}
            </View>
            <Text style={styles.biography}>{saint.biography}</Text>
          </Card>
        ) : (
          <Text style={styles.helperText}>Todavía no hay contenido de santos disponible.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  image: { width: '100%', aspectRatio: 1, borderRadius: 16, marginBottom: spacing.md },
  name: { fontFamily: fontFamily.display, fontSize: fontSize.xl, color: colors.textPrimary },
  bio: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 4 },
  virtues: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.md },
  biography: { fontFamily: fontFamily.body, fontSize: fontSize.base, color: colors.textPrimary, marginTop: spacing.md, lineHeight: 24 },
  helperText: { fontFamily: fontFamily.body, color: colors.textSecondary },
});
