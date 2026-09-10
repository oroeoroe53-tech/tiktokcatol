import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAdminRole, useAuthStore } from '../stores/auth-store';

export function useRequireAdmin() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user || !isAdminRole(user.role)) {
      router.replace('/login');
    }
  }, [user, router]);

  return user;
}
