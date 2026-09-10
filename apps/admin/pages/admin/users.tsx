import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/AdminLayout';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api-client';
import type { UserStatus } from '@faro/types';

interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  status: UserStatus;
  createdAt: string;
}

export default function AdminUsersPage() {
  const user = useRequireAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => api.get<{ items: AdminUser[] }>(`/admin/users${search ? `?q=${encodeURIComponent(search)}` : ''}`),
    enabled: !!user,
  });

  const suspend = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/admin/users/${id}/suspend`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const ban = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.patch(`/admin/users/${id}/ban`, { reason }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
  const reinstate = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/reinstate`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  if (!user) return null;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-ink mb-6">Usuarios</h1>
      <input
        placeholder="Buscar por email o usuario…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border border-border rounded-lg px-3 py-2 text-sm mb-4 w-80"
      />
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-textSecondary">
            <tr>
              <th className="p-3">Usuario</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.items.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3 font-medium">@{u.username}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.status === 'ACTIVE' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  {u.status === 'ACTIVE' ? (
                    <>
                      <button
                        className="text-xs text-primary underline"
                        onClick={() => suspend.mutate({ id: u.id, reason: 'Revisión manual desde el panel' })}
                      >
                        Suspender
                      </button>
                      <button
                        className="text-xs text-danger underline"
                        onClick={() => ban.mutate({ id: u.id, reason: 'Revisión manual desde el panel' })}
                      >
                        Banear
                      </button>
                    </>
                  ) : (
                    <button className="text-xs text-success underline" onClick={() => reinstate.mutate(u.id)}>
                      Reactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
