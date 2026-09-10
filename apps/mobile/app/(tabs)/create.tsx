import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { ContentCategory, VideoVisibility } from '@faro/types';
import { MAX_VIDEO_DURATION_SECONDS } from '@faro/validation';
import { Button, Chip, ScreenHeader, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { useCreateUploadUrl, usePublishVideo } from '../../hooks/useVideos';
import { useAuthStore } from '../../stores/auth-store';

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

export default function CreateScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ContentCategory>(ContentCategory.TESTIMONY);
  const [hashtagsText, setHashtagsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'pick' | 'details' | 'done'>('pick');

  const createUploadUrl = useCreateUploadUrl();
  const publishVideo = usePublishVideo();

  if (!user) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenHeader title="Crear" />
        <View style={styles.center}>
          <Text style={styles.helperText}>Inicia sesión para publicar un vídeo.</Text>
          <Button label="Iniciar sesión" onPress={() => router.push('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  const pickVideo = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Necesitamos permiso para acceder a tus vídeos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: MAX_VIDEO_DURATION_SECONDS,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAsset(result.assets[0]);
      setStep('details');
    }
  };

  const onPublish = async () => {
    if (!asset) return;
    setError(null);
    try {
      const fileName = asset.fileName ?? `video-${Date.now()}.mp4`;
      const contentType = asset.mimeType ?? 'video/mp4';
      const fileSizeBytes = asset.fileSize ?? 1;

      const { storageKey, uploadUrl } = await createUploadUrl.mutateAsync({
        fileName,
        contentType: contentType as 'video/mp4',
        fileSizeBytes,
      });

      const fileResponse = await fetch(asset.uri);
      const blob = await fileResponse.blob();
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
      });
      if (!uploadResponse.ok) throw new Error('No se pudo subir el vídeo al almacenamiento.');

      const hashtags = hashtagsText
        .split(/[\s,]+/)
        .map((h) => h.replace('#', '').trim())
        .filter(Boolean)
        .slice(0, 10);

      await publishVideo.mutateAsync({
        storageKey,
        title,
        description,
        category,
        hashtags,
        language: 'es',
        visibility: VideoVisibility.PUBLIC,
        durationSeconds: Math.round(asset.duration ? asset.duration / 1000 : 15),
      });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo publicar el vídeo.');
    }
  };

  const busy = createUploadUrl.isPending || publishVideo.isPending;

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Crear" subtitle="Comparte una reflexión, testimonio o momento de fe" />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {step === 'pick' && (
          <TouchableOpacity style={styles.pickBox} onPress={pickVideo}>
            <Text style={styles.pickBoxText}>Toca para seleccionar un vídeo (máx. {MAX_VIDEO_DURATION_SECONDS}s)</Text>
          </TouchableOpacity>
        )}

        {step === 'details' && asset && (
          <>
            <Video source={{ uri: asset.uri }} style={styles.preview} resizeMode={ResizeMode.COVER} useNativeControls isLooping />
            <TextInput style={styles.input} placeholder="Título" value={title} onChangeText={setTitle} maxLength={120} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descripción (opcional)"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={500}
            />
            <Text style={styles.label}>Categoría</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <Chip key={key} label={label} selected={category === key} onPress={() => setCategory(key as ContentCategory)} />
              ))}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Hashtags separados por espacio (ej: evangelio oracion)"
              value={hashtagsText}
              onChangeText={setHashtagsText}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Publicar" variant="accent" fullWidth loading={busy} disabled={!title} onPress={onPublish} />
          </>
        )}

        {step === 'done' && (
          <View style={styles.center}>
            <Text style={styles.doneTitle}>¡Publicado!</Text>
            <Text style={styles.helperText}>
              Tu vídeo se está procesando y aparecerá en el feed en cuanto termine y pase moderación.
            </Text>
            <Button
              label="Volver al inicio"
              onPress={() => {
                setStep('pick');
                setAsset(null);
                setTitle('');
                setDescription('');
                setHashtagsText('');
                router.push('/(tabs)');
              }}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  helperText: { fontFamily: fontFamily.body, color: colors.textSecondary, textAlign: 'center' },
  pickBox: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: radius.lg,
    padding: spacing['3xl'],
    alignItems: 'center',
  },
  pickBoxText: { fontFamily: fontFamily.bodyMedium, color: colors.textSecondary, textAlign: 'center' },
  preview: { width: '100%', aspectRatio: 9 / 16, maxHeight: 320, borderRadius: radius.md, marginBottom: spacing.md, backgroundColor: colors.ink },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  error: { color: colors.danger, fontFamily: fontFamily.body, fontSize: fontSize.sm, marginBottom: spacing.md },
  doneTitle: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], color: colors.textPrimary },
});
