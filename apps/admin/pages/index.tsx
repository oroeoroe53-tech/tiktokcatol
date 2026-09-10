import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAdminRole, useAuthStore } from '../stores/auth-store';

export default function IndexRedirect() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    router.replace(user && isAdminRole(user.role) ? '/admin' : '/login');
  }, [user, router]);

  return null;
}
