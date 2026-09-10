import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Badge, Card, ScreenHeader, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { useBibleBooks, useBibleChapter, useGospelOfTheDay, useToggleFavoriteVerse } from '../../hooks/useBible';

export default function BibleScreen() {
  const router = useRouter();
  const gospel = useGospelOfTheDay();
  const books = useBibleBooks();
  const [selectedBookId, setSelectedBookId] = useState<string | undefined>();
  const [selectedChapter, setSelectedChapter] = useState<number | undefined>();
  const chapter = useBibleChapter(selectedBookId, selectedChapter);
  const toggleFavorite = useToggleFavoriteVerse();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <ScreenHeader title="Biblia" subtitle="Palabra de Dios para hoy" />
        </View>

        <Card>
          <Badge label="Evangelio del día" tone="accent" />
          {gospel.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
          ) : (
            gospel.data?.map((verse) => (
              <Text key={verse.id} style={styles.verse}>
                <Text style={styles.verseNumber}>{verse.verseNumber} </Text>
                {verse.text}
              </Text>
            ))
          )}
          {gospel.data && gospel.data.length > 0 && (
            <Text style={styles.translation}>{gospel.data[0]?.translation}</Text>
          )}
        </Card>

        <Text style={styles.sectionTitle}>Libros</Text>
        <View style={styles.bookGrid}>
          {books.data?.map((book) => (
            <TouchableOpacity
              key={book.id}
              style={[styles.bookChip, selectedBookId === book.id && styles.bookChipSelected]}
              onPress={() => {
                setSelectedBookId(book.id);
                setSelectedChapter(1);
              }}
            >
              <Text style={[styles.bookChipText, selectedBookId === book.id && styles.bookChipTextSelected]}>
                {book.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedBookId && (
          <Card>
            <Text style={styles.sectionTitle}>Capítulo {selectedChapter}</Text>
            {chapter.isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              chapter.data?.map((verse) => (
                <TouchableOpacity key={verse.id} onLongPress={() => toggleFavorite.mutate({ verseId: verse.id, favorite: true })}>
                  <Text style={styles.verse}>
                    <Text style={styles.verseNumber}>{verse.verseNumber} </Text>
                    {verse.text}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            {chapter.data?.length === 0 && (
              <Text style={styles.helperText}>Este contenido aún no está disponible en el catálogo de demostración.</Text>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  verse: { fontFamily: fontFamily.body, fontSize: fontSize.base, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 24 },
  verseNumber: { fontFamily: fontFamily.bodyBold, color: colors.primary, fontSize: fontSize.sm },
  translation: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.md, fontStyle: 'italic' },
  sectionTitle: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.lg, color: colors.textPrimary },
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  bookChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  bookChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  bookChipText: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, color: colors.textPrimary },
  bookChipTextSelected: { color: colors.white },
  helperText: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.sm },
});
