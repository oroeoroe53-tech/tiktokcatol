import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { ContentCategory } from '@faro/types';
import { Button, Chip } from '@faro/ui';
import { OnboardingScreen } from '../../components/onboarding/OnboardingScreen';
import { useOnboardingStore } from '../../stores/onboarding-store';

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

export default function InterestsScreen() {
  const router = useRouter();
  const { interests, toggleInterest } = useOnboardingStore();

  return (
    <OnboardingScreen
      step={3}
      title="Elige tus temas favoritos"
      subtitle="Personalizaremos tu feed a partir de esto (podrás cambiarlo cuando quieras)."
      footer={
        <Button
          label="Continuar"
          variant="accent"
          fullWidth
          disabled={interests.length === 0}
          onPress={() => router.push('/onboarding/notifications')}
        />
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <Chip key={key} label={label} selected={interests.includes(key)} onPress={() => toggleInterest(key)} />
        ))}
      </View>
    </OnboardingScreen>
  );
}
