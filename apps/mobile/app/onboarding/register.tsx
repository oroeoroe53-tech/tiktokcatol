import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@faro/validation';
import { Button, colors, fontFamily, fontSize, radius, spacing } from '@faro/ui';
import { OnboardingScreen } from '../../components/onboarding/OnboardingScreen';
import { useOnboardingStore } from '../../stores/onboarding-store';
import { useRegister } from '../../hooks/useAuth';
import { useUpdatePreferences, useCompleteOnboarding } from '../../hooks/useUser';
import { api, ApiError } from '../../services/api-client';

export default function RegisterScreen() {
  const router = useRouter();
  const { objective, interests, notificationFrequency, reset } = useOnboardingStore();
  const registerMutation = useRegister();
  const updatePreferences = useUpdatePreferences();
  const completeOnboarding = useCompleteOnboarding();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { locale: 'es' },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerMutation.mutateAsync(data);
      await updatePreferences.mutateAsync({
        interests,
        language: 'es',
        notificationFrequency,
      });
      if (objective) {
        await api.patch('/users/me/onboarding/objective', { objective });
      }
      await completeOnboarding.mutateAsync();
      reset();
      router.replace('/(tabs)');
    } catch (error) {
      setServerError(error instanceof ApiError ? error.message : 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    }
  };

  const busy = registerMutation.isPending || updatePreferences.isPending || completeOnboarding.isPending;

  return (
    <OnboardingScreen
      step={5}
      title="Crea tu cuenta"
      subtitle="Último paso — en 30 segundos verás tu primer vídeo."
      footer={
        <Button label="Crear cuenta" variant="accent" fullWidth loading={busy} onPress={handleSubmit(onSubmit)} />
      }
    >
      <View style={{ gap: spacing.sm }}>
        <Field name="displayName" control={control} placeholder="Nombre" error={errors.displayName?.message} />
        <Field
          name="username"
          control={control}
          placeholder="Nombre de usuario"
          autoCapitalize="none"
          error={errors.username?.message}
        />
        <Field
          name="email"
          control={control}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email?.message}
        />
        <Field
          name="password"
          control={control}
          placeholder="Contraseña"
          secureTextEntry
          error={errors.password?.message}
        />
        <Field
          name="dateOfBirth"
          control={control}
          placeholder="Fecha de nacimiento (AAAA-MM-DD)"
          error={errors.dateOfBirth?.message}
        />
        {serverError ? <Text style={styles.serverError}>{serverError}</Text> : null}
      </View>
    </OnboardingScreen>
  );
}

function Field({
  name,
  control,
  error,
  ...inputProps
}: {
  name: keyof RegisterInput;
  control: any;
  error?: string;
  [key: string]: any;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View>
          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholderTextColor="rgba(255,255,255,0.4)"
            onBlur={onBlur}
            onChangeText={onChange}
            value={typeof value === 'string' ? value : ''}
            {...inputProps}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
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
  inputError: { borderColor: colors.danger },
  errorText: { color: '#FF9AA0', fontFamily: fontFamily.body, fontSize: fontSize.xs, marginTop: 4 },
  serverError: {
    color: '#FF9AA0',
    fontFamily: fontFamily.bodyMedium,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
