import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '../../components/AdminLayout';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api-client';

interface Overview {
  totalUsers: number;
  activeUsers: number;
  dau: number;
  wau: number;
  mau: number;
  totalVideos: number;
  totalViews: number;
  openReports: number;
  pendingVerifications: number;
  totalPrayerSessions: number;
  totalChallengeCompletions: number;
}

export default function AdminDashboard() {
  const user = useRequireAdmin();
  const { data } = useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => api.get<Overview>('/admin/dashboard/overview'),
    enabled: !!user,
  });

  if (!user) return null;

  const cards: { label: string; value: number | undefined }[] = [
    { label: 'Usuarios totales', value: data?.totalUsers },
    { label: 'Usuarios activos', value: data?.activeUsers },
    { label: 'DAU', value: data?.dau },
    { label: 'WAU', value: data?.wau },
    { label: 'MAU', value: data?.mau },
    { label: 'Vídeos', value: data?.totalVideos },
    { label: 'Visualizaciones', value: data?.totalViews },
    { label: 'Denuncias abiertas', value: data?.openReports },
    { label: 'Verificaciones pendientes', value: data?.pendingVerifications },
    { label: 'Sesiones de oración', value: data?.totalPrayerSessions },
    { label: 'Retos completados', value: data?.totalChallengeCompletions },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-ink mb-6">Resumen</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-surface border border-border rounded-2xl p-5">
            <div className="text-3xl font-bold text-primary">{card.value ?? '—'}</div>
            <div className="text-sm text-textSecondary mt-1">{card.label}</div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
