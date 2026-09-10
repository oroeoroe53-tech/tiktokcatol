import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '../../components/AdminLayout';
import { useRequireAdmin } from '../../hooks/useRequireAdmin';
import { api } from '../../services/api-client';

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  createdAt: string;
  admin: { username: string };
}

export default function AdminAuditLogPage() {
  const user = useRequireAdmin();
  const { data } = useQuery({
    queryKey: ['admin', 'audit-log'],
    queryFn: () => api.get<AuditLogEntry[]>('/admin/dashboard/audit-log'),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-ink mb-6">Registro de auditoría</h1>
      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg text-left text-textSecondary">
            <tr>
              <th className="p-3">Fecha</th>
              <th className="p-3">Admin</th>
              <th className="p-3">Acción</th>
              <th className="p-3">Objetivo</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((entry) => (
              <tr key={entry.id} className="border-t border-border">
                <td className="p-3">{new Date(entry.createdAt).toLocaleString('es-ES')}</td>
                <td className="p-3">@{entry.admin.username}</td>
                <td className="p-3">{entry.action}</td>
                <td className="p-3 text-textSecondary">
                  {entry.targetType} · {entry.targetId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
