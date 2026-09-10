import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/AdminLayout';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api-client';

interface Category {
  key: string;
  labelEs: string;
  labelEn: string;
  active: boolean;
  order: number;
}

export default function AdminContentPage() {
  const user = useRequireAdmin();
  const queryClient = useQueryClient();
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastResult, setBroadcastResult] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get<Category[]>('/admin/content/categories'),
    enabled: !!user,
  });

  const toggleActive = useMutation({
    mutationFn: ({ key, active }: { key: string; active: boolean }) =>
      api.patch(`/admin/content/categories/${key}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] }),
  });

  const broadcast = useMutation({
    mutationFn: () =>
      api.post<{ recipientCount: number }>('/admin/content/notifications/broadcast', {
        title: broadcastTitle,
        body: broadcastBody,
        audience: 'ACTIVE_7D',
      }),
    onSuccess: (data) => {
      setBroadcastResult(`Notificación enviada a ${data.recipientCount} usuarios activos.`);
      setBroadcastTitle('');
      setBroadcastBody('');
    },
  });

  if (!user) return null;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-ink mb-6">Contenido</h1>

      <section className="bg-surface border border-border rounded-2xl p-5 mb-6">
        <h2 className="font-semibold mb-3">Categorías</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {categories?.map((cat) => (
            <label key={cat.key} className="flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-2">
              <input
                type="checkbox"
                checked={cat.active}
                onChange={(e) => toggleActive.mutate({ key: cat.key, active: e.target.checked })}
              />
              {cat.labelEs}
            </label>
          ))}
        </div>
      </section>

      <section className="bg-surface border border-border rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Notificación editorial</h2>
        <input
          placeholder="Título"
          value={broadcastTitle}
          onChange={(e) => setBroadcastTitle(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2"
        />
        <textarea
          placeholder="Mensaje"
          value={broadcastBody}
          onChange={(e) => setBroadcastBody(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm mb-2"
          rows={3}
        />
        <button
          disabled={!broadcastTitle || !broadcastBody || broadcast.isPending}
          onClick={() => broadcast.mutate()}
          className="bg-primary text-white rounded-full px-4 py-2 text-sm disabled:opacity-50"
        >
          Enviar a usuarios activos (7 días)
        </button>
        {broadcastResult && <p className="text-sm text-success mt-2">{broadcastResult}</p>}
      </section>
    </AdminLayout>
  );
}
