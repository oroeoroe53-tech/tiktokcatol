import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginSchema, type LoginInput } from '@faro/validation';
import { Button, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { useLogin } from '../../hooks/useAuth';
import { ApiError } from '../../services/api-client';

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await loginMutation.mutateAsync(data);
      router.replace('/(tabs)');
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'No se pudo iniciar sesión.');
    }
  };

  return (
    <LinearGradient colors={[colors.ink, colors.primaryDark]} style={{ flex: 1 }}>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.title}>Bienvenido de nuevo</Text>
        <Text style={styles.subtitle}>Inicia sesión para continuar tu camino de fe.</Text>

        <View style={{ gap: spacing.sm, marginTop: spacing.xl }}>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.4)"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
              />
            )}
          />
          {errors.email ? <Text style={styles.errorText}>{errors.email.message}</Text> : null}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry
                onBlur={onBlur}
                onChangeText={onChange}
                value={value ?? ''}
              />
            )}
          />
          {errors.password ? <Text style={styles.errorText}>{errors.password.message}</Text> : null}
          {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Button
            label="Iniciar sesión"
            variant="accent"
            fullWidth
            loading={loginMutation.isPending}
            onPress={handleSubmit(onSubmit)}
          />
        </View>

        <Link href="/(auth)/forgot-password" style={styles.link}>
          <Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text>
        </Link>
        <Link href="/onboarding" style={styles.link}>
          <Text style={styles.linkText}>Crear una cuenta nueva</Text>
        </Link>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' },
  title: { fontFamily: fontFamily.display, fontSize: fontSize['2xl'], color: colors.white },
  subtitle: { fontFamily: fontFamily.body, fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
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
  errorText: { color: '#FF9AA0', fontFamily: fontFamily.body, fontSize: fontSize.xs },
  link: { marginTop: spacing.lg, alignSelf: 'center' },
  linkText: { color: 'rgba(255,255,255,0.8)', fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm },
});
