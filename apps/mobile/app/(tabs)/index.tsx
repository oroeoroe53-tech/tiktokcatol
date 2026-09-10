import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, View, type ViewToken } from 'react-native';
import type { VideoSummary } from '@faro/types';
import { colors, EmptyState } from '@faro/ui';
import { VideoFeedItem } from '../../components/feed/VideoFeedItem';
import { CommentSheet } from '../../components/feed/CommentSheet';
import { useFeed, useMarkNotInterested, useRecordView } from '../../hooks/useFeed';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function FeedScreen() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useFeed();
  const markNotInterested = useMarkNotInterested();
  const recordView = useRecordView();
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);
  const watchStartRef = useRef<number>(Date.now());

  const items = useMemo<VideoSummary[]>(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 70 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      const previous = items[activeIndex];
      if (previous) {
        const watchTimeSeconds = (Date.now() - watchStartRef.current) / 1000;
        recordView.mutate({ videoId: previous.id, watchTimeSeconds, completed: watchTimeSeconds >= previous.duration * 0.9 });
      }
      watchStartRef.current = Date.now();
      setActiveIndex(first.index);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }).current;

  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.ink }]}>
        <EmptyState
          emoji="🕊️"
          title="Todavía no hay vídeos"
          description="Vuelve a intentarlo en unos segundos."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <VideoFeedItem
            video={item}
            isActive={index === activeIndex}
            onCommentPress={() => setCommentVideoId(item.id)}
            onNotInterested={() => markNotInterested.mutate(item.id)}
          />
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        refreshing={isRefetching}
        onRefresh={refetch}
        getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
        windowSize={3}
        maxToRenderPerBatch={2}
        removeClippedSubviews
      />
      <CommentSheet videoId={commentVideoId} onClose={() => setCommentVideoId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
