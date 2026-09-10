import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { useReportContent } from '../../hooks/useFeed';
import { useAuthStore } from '../../stores/auth-store';

const REASONS: { key: string; label: string }[] = [
  { key: 'SPAM', label: 'Spam' },
  { key: 'HARASSMENT', label: 'Acoso' },
  { key: 'HATE_SPEECH', label: 'Discurso de odio' },
  { key: 'SEXUAL_CONTENT', label: 'Contenido sexual' },
  { key: 'MISINFORMATION', label: 'Desinformación' },
  { key: 'OTHER', label: 'Otro motivo' },
];

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  onNotInterested: () => void;
  targetType: 'VIDEO' | 'COMMENT' | 'USER' | 'PRAYER_INTENTION';
  targetId: string;
}

export function ReportSheet({ visible, onClose, onNotInterested, targetType, targetId }: ReportSheetProps) {
  const user = useAuthStore((s) => s.user);
  const reportMutation = useReportContent();
  const [showReasons, setShowReasons] = useState(false);
  const [sent, setSent] = useState(false);

  const submitReport = async (reason: string) => {
    if (!user) return;
    await reportMutation.mutateAsync({ targetType, targetId, reason });
    setSent(true);
  };

  const close = () => {
    setShowReasons(false);
    setSent(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          {sent ? (
            <Text style={styles.confirmation}>Gracias, hemos recibido tu reporte y lo revisaremos.</Text>
          ) : !showReasons ? (
            <>
              <Option icon="eye-off-outline" label="No me interesa" onPress={onNotInterested} />
              <Option icon="flag-outline" label="Reportar" onPress={() => setShowReasons(true)} />
            </>
          ) : (
            REASONS.map((reason) => (
              <Option key={reason.key} icon="alert-circle-outline" label={reason.label} onPress={() => submitReport(reason.key)} />
            ))
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Option({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.option} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.textPrimary} />
      <Text style={styles.optionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(20,19,43,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  optionLabel: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, color: colors.textPrimary },
  confirmation: { fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, color: colors.textPrimary, textAlign: 'center', paddingVertical: spacing.lg },
});
