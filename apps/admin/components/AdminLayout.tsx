import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../stores/auth-store';

const NAV = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/users', label: 'Usuarios' },
  { href: '/admin/moderation', label: 'Moderación' },
  { href: '/admin/verification', label: 'Verificaciones' },
  { href: '/admin/content', label: 'Contenido' },
  { href: '/admin/audit-log', label: 'Registro de auditoría' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-64 bg-ink text-white flex flex-col p-6 gap-1">
        <div className="text-xl font-bold mb-8">
          Faro <span className="text-accent">Admin</span>
        </div>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-lg text-sm font-medium ${
              router.pathname === item.href ? 'bg-primary text-white' : 'text-white/70 hover:bg-white/10'
            }`}
          >
            {item.label}
          </Link>
        ))}
        <div className="mt-auto pt-6 border-t border-white/10">
          <div className="text-sm text-white/80">{user?.displayName}</div>
          <div className="text-xs text-white/50 mb-3">{user?.role}</div>
          <button
            onClick={() => {
              logout();
              router.push('/login');
            }}
            className="text-sm text-white/70 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
