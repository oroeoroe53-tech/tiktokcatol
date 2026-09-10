import React from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Badge, Button, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { useUserVideos } from '../../hooks/useUser';
import { useFollowCreator } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/auth-store';
import type { PaginatedResult, VideoSummary } from '@faro/types';

export default function CreatorProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const videosQuery = useUserVideos(id);
  const followMutation = useFollowCreator();

  const result = videosQuery.data as PaginatedResult<VideoSummary> | undefined;
  const videos = result?.items ?? [];
  const creator = videos[0]?.creator;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      {videosQuery.isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
      ) : (
        <>
          <View style={styles.header}>
            <Avatar uri={creator?.avatarUrl} name={creator?.displayName ?? 'Creador'} size={72} verified={creator?.verified} />
            <Text style={styles.name}>{creator?.displayName ?? 'Creador de Faro'}</Text>
            <Text style={styles.username}>@{creator?.username}</Text>
            {creator?.verified && <Badge label="Verificado" tone="accent" />}
            {user && creator && user.id !== creator.id && (
              <Button
                label="Seguir"
                variant="accent"
                onPress={() => followMutation.mutate({ userId: creator.id, follow: true })}
              />
            )}
          </View>
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id}
            numColumns={3}
            contentContainerStyle={{ padding: spacing.sm }}
            renderItem={({ item }) => (
              <View style={styles.thumbWrap}>
                {item.thumbnailUrl && <Image source={{ uri: item.thumbnailUrl }} style={styles.thumb} />}
              </View>
            )}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { alignItems: 'center', gap: 4, paddingVertical: spacing.lg },
  name: { fontFamily: fontFamily.display, fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm },
  username: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary },
  thumbWrap: { width: '33.33%', aspectRatio: 9 / 16, padding: 2 },
  thumb: { width: '100%', height: '100%', borderRadius: 8, backgroundColor: colors.surfaceAlt },
});
