import React, { useRef, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { VideoSummary } from '@faro/types';
import { Avatar, Badge, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { useFollowCreator, useLikeVideo, useSaveVideo } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/auth-store';
import { ReportSheet } from './ReportSheet';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoFeedItemProps {
  video: VideoSummary;
  isActive: boolean;
  onCommentPress: () => void;
  onNotInterested: () => void;
}

export function VideoFeedItem({ video, isActive, onCommentPress, onNotInterested }: VideoFeedItemProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const videoRef = useRef<Video>(null);
  const [paused, setPaused] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const likeMutation = useLikeVideo();
  const saveMutation = useSaveVideo();
  const followMutation = useFollowCreator();

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (isActive && !paused) {
      videoRef.current.playAsync().catch(() => undefined);
    } else {
      videoRef.current.pauseAsync().catch(() => undefined);
    }
  }, [isActive, paused]);

  const requireAuth = (action: () => void) => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    action();
  };

  return (
    <View style={styles.container}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => setPaused((p) => !p)}>
        <Video
          ref={videoRef}
          source={{ uri: video.videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={isActive && !paused}
        />
      </Pressable>

      <LinearGradient colors={['transparent', 'rgba(20,19,43,0.85)']} style={styles.bottomGradient} pointerEvents="none" />

      {video.status === 'READY' ? null : (
        <View style={styles.processingOverlay}>
          <Text style={styles.processingText}>Procesando vídeo…</Text>
        </View>
      )}

      {paused && (
        <View style={styles.pauseOverlay} pointerEvents="none">
          <Ionicons name="play" size={64} color="rgba(255,255,255,0.85)" />
        </View>
      )}

      <View style={styles.infoColumn}>
        {video.isDemoContent ? <Badge label="DEMO" tone="demo" /> : null}
        <Pressable onPress={() => router.push(`/creator/${video.creator.id}`)} style={styles.creatorRow}>
          <Avatar uri={video.creator.avatarUrl} name={video.creator.displayName} size={36} verified={video.creator.verified} />
          <Text style={styles.creatorName}>@{video.creator.username}</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={2}>
          {video.title}
        </Text>
        {video.hashtags.length > 0 && (
          <Text style={styles.hashtags} numberOfLines={1}>
            {video.hashtags.map((h) => `#${h}`).join('  ')}
          </Text>
        )}
      </View>

      <View style={styles.actionRail}>
        <ActionButton
          icon={video.viewerHasLiked ? 'flame' : 'flame-outline'}
          active={video.viewerHasLiked}
          label={String(video.likeCount)}
          onPress={() => requireAuth(() => likeMutation.mutate({ videoId: video.id, like: !video.viewerHasLiked }))}
        />
        <ActionButton icon="chatbubble-outline" label={String(video.commentCount)} onPress={onCommentPress} />
        <ActionButton
          icon={video.viewerHasSaved ? 'bookmark' : 'bookmark-outline'}
          active={video.viewerHasSaved}
          label={String(video.saveCount)}
          onPress={() => requireAuth(() => saveMutation.mutate({ videoId: video.id, save: !video.viewerHasSaved }))}
        />
        <ActionButton icon="share-outline" label="Compartir" onPress={() => {}} />
        {!video.viewerIsFollowingCreator && user?.id !== video.creator.id && (
          <ActionButton
            icon="person-add-outline"
            label="Seguir"
            onPress={() => requireAuth(() => followMutation.mutate({ userId: video.creator.id, follow: true }))}
          />
        )}
        <ActionButton icon="ellipsis-horizontal" label="Más" onPress={() => setReportOpen(true)} />
      </View>

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        onNotInterested={() => {
          onNotInterested();
          setReportOpen(false);
        }}
        targetType="VIDEO"
        targetId={video.id}
      />
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable style={styles.actionButton} onPress={onPress} accessibilityRole="button">
      <View style={[styles.actionIconWrap, active && styles.actionIconWrapActive]}>
        <Ionicons name={icon} size={26} color={active ? colors.accent : colors.white} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { height: SCREEN_HEIGHT, width: '100%', backgroundColor: colors.ink },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 260 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,19,43,0.5)',
  },
  processingText: { color: colors.white, fontFamily: fontFamily.bodyMedium },
  pauseOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  infoColumn: { position: 'absolute', left: spacing.lg, right: 90, bottom: 110, gap: spacing.xs },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  creatorName: { color: colors.white, fontFamily: fontFamily.bodyBold, fontSize: fontSize.base },
  title: { color: colors.white, fontFamily: fontFamily.body, fontSize: fontSize.base },
  hashtags: { color: colors.accentSoft, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm },
  actionRail: { position: 'absolute', right: spacing.md, bottom: 110, alignItems: 'center', gap: spacing.lg },
  actionButton: { alignItems: 'center', gap: 4 },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrapActive: { backgroundColor: 'rgba(245,166,35,0.2)' },
  actionLabel: { color: colors.white, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs },
});
