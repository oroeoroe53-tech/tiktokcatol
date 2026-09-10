import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { VerificationType } from '@faro/types';
import { Button, ScreenHeader, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { api, ApiError } from '../services/api-client';

const TYPES: { key: VerificationType; label: string }[] = [
  { key: VerificationType.PRIEST, label: 'Sacerdote' },
  { key: VerificationType.RELIGIOUS, label: 'Religioso/a' },
  { key: VerificationType.CATECHIST, label: 'Catequista' },
  { key: VerificationType.PARISH, label: 'Parroquia' },
  { key: VerificationType.DIOCESE, label: 'Diócesis' },
  { key: VerificationType.ORGANIZATION, label: 'Organización católica' },
  { key: VerificationType.CREATOR, label: 'Creador de contenido' },
];

export default function CreatorVerificationScreen() {
  const router = useRouter();
  const [type, setType] = useState<VerificationType>(VerificationType.CREATOR);
  const [legalName, setLegalName] = useState('');
  const [organization, setOrganization] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setStatus('loading');
    setError(null);
    try {
      await api.post('/creators/verification-requests', { type, legalName, organization, notes });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar la solicitud.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <ScreenHeader title="Verificación de creador" subtitle="Un moderador revisará tu solicitud manualmente" />
      </View>

      {status === 'sent' ? (
        <View style={styles.center}>
          <Text style={styles.doneText}>
            Solicitud enviada. Te avisaremos por notificación cuando haya sido revisada.
          </Text>
          <Button label="Volver" onPress={() => router.back()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.sm }}>
          <Text style={styles.label}>Tipo</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                onPress={() => setType(t.key)}
                style={[styles.typeChip, type === t.key && styles.typeChipSelected]}
              >
                <Text style={[styles.typeChipText, type === t.key && styles.typeChipTextSelected]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Nombre legal completo" value={legalName} onChangeText={setLegalName} />
          <TextInput
            style={styles.input}
            placeholder="Organización / parroquia / diócesis (opcional)"
            value={organization}
            onChangeText={setOrganization}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cuéntanos más para ayudarnos a verificarte"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label="Enviar solicitud"
            variant="accent"
            fullWidth
            loading={status === 'loading'}
            disabled={!legalName}
            onPress={submit}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  doneText: { fontFamily: fontFamily.body, color: colors.textPrimary, textAlign: 'center' },
  label: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, color: colors.textSecondary },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
  typeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeChipText: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, color: colors.textPrimary },
  typeChipTextSelected: { color: colors.white },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
    backgroundColor: colors.surface,
  },
  textArea: { height: 90, textAlignVertical: 'top' },
  error: { color: colors.danger, fontFamily: fontFamily.body, fontSize: fontSize.sm },
});
