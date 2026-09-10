import { create } from 'zustand';
import { FaithPathObjective } from '@faro/types';

interface OnboardingState {
  objective: FaithPathObjective | null;
  interests: string[];
  notificationFrequency: 'DAILY' | 'FEW_TIMES_WEEK' | 'WEEKLY' | 'NEVER';
  setObjective: (objective: FaithPathObjective) => void;
  toggleInterest: (interest: string) => void;
  setNotificationFrequency: (freq: OnboardingState['notificationFrequency']) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  objective: null,
  interests: [],
  notificationFrequency: 'FEW_TIMES_WEEK',
  setObjective: (objective) => set({ objective }),
  toggleInterest: (interest) => {
    const { interests } = get();
    set({
      interests: interests.includes(interest)
        ? interests.filter((i) => i !== interest)
        : [...interests, interest],
    });
  },
  setNotificationFrequency: (notificationFrequency) => set({ notificationFrequency }),
  reset: () => set({ objective: null, interests: [], notificationFrequency: 'FEW_TIMES_WEEK' }),
}));
