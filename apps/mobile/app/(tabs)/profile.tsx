import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Avatar, Badge, Button, Card, colors, fontFamily, fontSize, spacing } from '@faro/ui';
import { useMyProfile } from '../../hooks/useUser';
import { useLogout } from '../../hooks/useAuth';
import { useAuthStore } from '../../stores/auth-store';

export default function ProfileScreen() {
  const router = useRouter();
  const authUser = useAuthStore((s) => s.user);
  const { data: profile } = useMyProfile();
  const logout = useLogout();

  if (!authUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.helperText}>Inicia sesión para ver tu perfil.</Text>
          <Button label="Iniciar sesión" onPress={() => router.push('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <View style={styles.header}>
          <Avatar uri={profile?.avatarUrl} name={profile?.displayName ?? authUser.displayName} size={72} verified={authUser.verified} />
          <Text style={styles.name}>{profile?.displayName ?? authUser.displayName}</Text>
          <Text style={styles.username}>@{profile?.username ?? authUser.username}</Text>
          {authUser.verified && <Badge label="Verificado" tone="accent" />}
          {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.statsRow}>
          <Stat label="Vídeos" value={profile?.videoCount ?? 0} />
          <Stat label="Seguidores" value={profile?.followerCount ?? 0} />
          <Stat label="Siguiendo" value={profile?.followingCount ?? 0} />
        </View>

        <Card style={{ marginTop: spacing.lg }}>
          <MenuRow label="Guardados" onPress={() => {}} />
          <MenuRow label="Historial de oración" onPress={() => {}} />
          <MenuRow label="Convertirme en creador verificado" onPress={() => router.push('/creator-verification')} />
          <MenuRow label="Dispositivos y sesiones" onPress={() => {}} />
          <MenuRow label="Privacidad y notificaciones" onPress={() => {}} />
        </Card>

        <View style={{ marginTop: spacing.xl }}>
          <Button label="Cerrar sesión" variant="outline" fullWidth loading={logout.isPending} onPress={() => logout.mutate()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Text style={styles.menuRow} onPress={onPress}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  helperText: { fontFamily: fontFamily.body, color: colors.textSecondary },
  header: { alignItems: 'center', gap: 4 },
  name: { fontFamily: fontFamily.display, fontSize: fontSize.xl, color: colors.textPrimary, marginTop: spacing.sm },
  username: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textSecondary },
  bio: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: spacing.xl },
  stat: { alignItems: 'center' },
  statValue: { fontFamily: fontFamily.bodyBold, fontSize: fontSize.lg, color: colors.textPrimary },
  statLabel: { fontFamily: fontFamily.body, fontSize: fontSize.xs, color: colors.textSecondary },
  menuRow: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
