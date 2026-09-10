import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { useComments, useCreateComment } from '../../hooks/useVideos';
import { useAuthStore } from '../../stores/auth-store';
import { useRouter } from 'expo-router';

interface CommentSheetProps {
  videoId: string | null;
  onClose: () => void;
}

export function CommentSheet({ videoId, onClose }: CommentSheetProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const commentsQuery = useComments(videoId ?? '');
  const createComment = useCreateComment(videoId ?? '');

  const onSend = async () => {
    if (!user) {
      onClose();
      router.push('/(auth)/login');
      return;
    }
    if (!text.trim()) return;
    await createComment.mutateAsync({ text: text.trim() });
    setText('');
  };

  return (
    <Modal visible={!!videoId} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.handle} />
            <Text style={styles.title}>Comentarios</Text>
            <FlatList
              data={commentsQuery.data?.items ?? []}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Avatar uri={item.author.avatarUrl} name={item.author.displayName} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentAuthor}>@{item.author.username}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.empty}>Sé el primero en comentar.</Text>}
            />
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Escribe un comentario respetuoso…"
                value={text}
                onChangeText={setText}
                multiline
              />
              <Pressable onPress={onSend} style={styles.sendButton}>
                <Ionicons name="send" size={18} color={colors.white} />
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,19,43,0.5)', justifyContent: 'flex-end' },
  sheetWrap: { justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    minHeight: 420,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.sm },
  title: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.lg, color: colors.textPrimary, marginBottom: spacing.sm },
  commentRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  commentAuthor: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.sm, color: colors.textPrimary },
  commentText: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary },
  empty: { fontFamily: fontFamily.body, color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.xl },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
