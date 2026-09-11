import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '../../components/AdminLayout';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api-client';

interface AdminReport {
  id: string;
  reason: string;
  description: string | null;
  status: string;
  targetType: string;
  targetVideoId: string | null;
  targetCommentId: string | null;
  reporter: { username: string };
  targetVideo: { title: string } | null;
  createdAt: string;
}

interface PendingVideo {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  creator: { username: string; displayName: string };
}

export default function AdminModerationPage() {
  const user = useRequireAdmin();
  const queryClient = useQueryClient();
  const [resolutionText, setResolutionText] = useState<Record<string, string>>({});

  const { data: pendingVideos } = useQuery({
    queryKey: ['admin', 'moderation', 'pending-videos'],
    queryFn: () => api.get<PendingVideo[]>('/admin/moderation/pending-videos'),
    enabled: !!user,
  });

  const { data: reports } = useQuery({
    queryKey: ['admin', 'moderation', 'reports'],
    queryFn: () => api.get<AdminReport[]>('/admin/moderation/reports?status=OPEN'),
    enabled: !!user,
  });

  const resolve = useMutation({
    mutationFn: ({ id, resolution, dismiss }: { id: string; resolution: string; dismiss: boolean }) =>
      api.patch(`/admin/moderation/reports/${id}/resolve`, { resolution, dismiss }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });

  const removeVideo = useMutation({
    mutationFn: (videoId: string) => api.patch(`/admin/moderation/videos/${videoId}/remove`, { reason: 'Denuncia confirmada' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });

  const approveVideo = useMutation({
    mutationFn: (videoId: string) => api.patch(`/admin/moderation/videos/${videoId}/restore`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });

  const rejectPendingVideo = useMutation({
    mutationFn: (videoId: string) => api.patch(`/admin/moderation/videos/${videoId}/remove`, { reason: 'Rechazado en revisión' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderation'] }),
  });

  if (!user) return null;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-ink mb-6">Moderación</h1>

      <section className="mb-8">
        <h2 className="font-semibold mb-3">Vídeos pendientes de revisión</h2>
        <div className="space-y-3">
          {pendingVideos?.length === 0 && <p className="text-textSecondary text-sm">No hay vídeos pendientes.</p>}
          {pendingVideos?.map((video) => (
            <div key={video.id} className="bg-surface border border-border rounded-2xl p-4 flex gap-4">
              {video.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={video.thumbnailUrl} alt="" className="w-20 h-28 object-cover rounded-lg bg-bg flex-shrink-0" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{video.title}</p>
                <p className="text-xs text-textSecondary">@{video.creator.username}</p>
                {video.description && <p className="text-xs text-textSecondary mt-1">{video.description}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    className="text-xs bg-success text-white rounded-full px-3 py-1.5"
                    onClick={() => approveVideo.mutate(video.id)}
                  >
                    Publicar
                  </button>
                  <button
                    className="text-xs bg-danger text-white rounded-full px-3 py-1.5"
                    onClick={() => rejectPendingVideo.mutate(video.id)}
                  >
                    Rechazar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <h2 className="font-semibold mb-3">Denuncias abiertas</h2>
      <div className="space-y-4">
        {reports?.length === 0 && <p className="text-textSecondary">No hay denuncias abiertas. 🎉</p>}
        {reports?.map((report) => (
          <div key={report.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-semibold uppercase text-primary">{report.targetType}</span>
                <span className="text-xs text-textSecondary ml-2">Motivo: {report.reason}</span>
              </div>
              <span className="text-xs text-textSecondary">Reportado por @{report.reporter.username}</span>
            </div>
            {report.targetVideo && <p className="text-sm font-medium mb-1">Vídeo: {report.targetVideo.title}</p>}
            {report.description && <p className="text-sm text-textSecondary mb-3">"{report.description}"</p>}

            <div className="flex items-center gap-2 mt-3">
              <input
                placeholder="Resolución / notas…"
                value={resolutionText[report.id] ?? ''}
                onChange={(e) => setResolutionText((prev) => ({ ...prev, [report.id]: e.target.value }))}
                className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm"
              />
              {report.targetVideoId && (
                <button
                  className="text-xs bg-danger text-white rounded-full px-3 py-1.5"
                  onClick={() => removeVideo.mutate(report.targetVideoId!)}
                >
                  Eliminar vídeo
                </button>
              )}
              <button
                className="text-xs bg-primary text-white rounded-full px-3 py-1.5"
                onClick={() =>
                  resolve.mutate({ id: report.id, resolution: resolutionText[report.id] ?? 'Resuelto', dismiss: false })
                }
              >
                Marcar resuelto
              </button>
              <button
                className="text-xs border border-border rounded-full px-3 py-1.5"
                onClick={() =>
                  resolve.mutate({ id: report.id, resolution: resolutionText[report.id] ?? 'Sin fundamento', dismiss: true })
                }
              >
                Descartar
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
