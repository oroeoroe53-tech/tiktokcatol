import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { useRequestPasswordReset } from '../../hooks/useAuth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const mutation = useRequestPasswordReset();

  const onSubmit = async () => {
    await mutation.mutateAsync(email);
    setSent(true);
  };

  return (
    <LinearGradient colors={[colors.ink, colors.primaryDark]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Recupera tu contraseña</Text>
        {sent ? (
          <Text style={styles.subtitle}>
            Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.
          </Text>
        ) : (
          <>
            <Text style={styles.subtitle}>Te enviaremos un enlace para restablecerla.</Text>
            <View style={{ marginTop: spacing.xl }}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View style={{ marginTop: spacing.lg }}>
              <Button label="Enviar enlace" variant="accent" fullWidth loading={mutation.isPending} onPress={onSubmit} />
            </View>
          </>
        )}
        <Button label="Volver" variant="ghost" fullWidth onPress={() => router.back()} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center', gap: spacing.md },
  title: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], color: colors.white },
  subtitle: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)' },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.white,
    fontFamily: fontFamily.body,
    fontSize: fontSize.base,
  },
});
