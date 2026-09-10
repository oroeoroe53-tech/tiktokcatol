import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/AdminLayout';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api-client';

interface VerificationRequest {
  id: string;
  type: string;
  legalName: string;
  organization: string | null;
  notes: string | null;
  submittedAt: string;
  user: { username: string; email: string };
}

export default function AdminVerificationPage() {
  const user = useRequireAdmin();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: requests } = useQuery({
    queryKey: ['admin', 'verification-requests'],
    queryFn: () => api.get<VerificationRequest[]>('/admin/verification-requests?status=PENDING'),
    enabled: !!user,
  });

  const approve = useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes?: string }) =>
      api.patch(`/admin/verification-requests/${id}/approve`, { reviewNotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  });
  const reject = useMutation({
    mutationFn: ({ id, reviewNotes }: { id: string; reviewNotes: string }) =>
      api.patch(`/admin/verification-requests/${id}/reject`, { reviewNotes }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'verification-requests'] }),
  });

  if (!user) return null;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-ink mb-6">Solicitudes de verificación</h1>
      <div className="space-y-4">
        {requests?.length === 0 && <p className="text-textSecondary">No hay solicitudes pendientes.</p>}
        {requests?.map((req) => (
          <div key={req.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{req.legalName}</p>
                <p className="text-xs text-textSecondary">
                  @{req.user.username} · {req.user.email} · {req.type}
                </p>
                {req.organization && <p className="text-sm mt-1">Organización: {req.organization}</p>}
                {req.notes && <p className="text-sm text-textSecondary mt-1">"{req.notes}"</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input
                placeholder="Notas de revisión…"
                value={notes[req.id] ?? ''}
                onChange={(e) => setNotes((prev) => ({ ...prev, [req.id]: e.target.value }))}
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm"
              />
              <button
                className="text-xs bg-success text-white rounded-full px-3 py-1.5"
                onClick={() => approve.mutate({ id: req.id, reviewNotes: notes[req.id] })}
              >
                Aprobar
              </button>
              <button
                className="text-xs bg-danger text-white rounded-full px-3 py-1.5"
                onClick={() => reject.mutate({ id: req.id, reviewNotes: notes[req.id] ?? 'No cumple los requisitos' })}
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
