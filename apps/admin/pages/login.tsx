import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import type { UserSummary } from '@faro/types';
import { api, ApiError } from '../services/api-client';
import { isAdminRole, useAuthStore } from '../stores/auth-store';

interface LoginResponse {
  user: UserSummary;
  accessToken: string;
  refreshToken: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await api.post<LoginResponse>('/auth/login', { email, password }, { auth: false });
      if (!isAdminRole(data.user.role)) {
        setError('Esta cuenta no tiene permisos de administración.');
        setLoading(false);
        return;
      }
      setSession(data.user, data.accessToken, data.refreshToken);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <form onSubmit={onSubmit} className="bg-surface rounded-2xl p-8 w-full max-w-sm shadow-xl">
        <div className="text-2xl font-bold text-ink mb-1">
          Faro <span className="text-accent">Admin</span>
        </div>
        <p className="text-sm text-textSecondary mb-6">Panel de administración interno</p>

        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        <label className="block text-sm font-medium mb-1">Contraseña</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 mb-4 text-sm"
        />

        {error ? <p className="text-danger text-sm mb-4">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-full py-2.5 font-semibold text-sm disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Iniciar sesión'}
        </button>
      </form>
    </div>
  );
}
