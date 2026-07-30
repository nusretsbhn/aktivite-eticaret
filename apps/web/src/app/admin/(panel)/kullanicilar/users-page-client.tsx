'use client';

import { useCallback, useEffect, useState } from 'react';

import type { AdminRole } from '@/lib/admin-users-server';

type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function roleLabel(role: AdminRole) {
  return role === 'alt_bayi' ? 'Alt bayi' : 'Admin';
}

export function AdminUsersPageClient() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AdminRole>('admin');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admin-users', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { users?: AdminUserRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Kullanıcılar alınamadı');
      setRows(
        Array.isArray(data.users)
          ? data.users.map((u) => ({
              ...u,
              role: u.role === 'alt_bayi' ? 'alt_bayi' : 'admin',
            }))
          : [],
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createUser() {
    setCreateError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setCreateError('Ad soyad, e-posta ve şifre zorunludur.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ fullName, email, password, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? 'Kullanıcı oluşturulamadı');
        return;
      }
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('admin');
      void load();
    } catch {
      setCreateError('Ağ hatası.');
    } finally {
      setCreating(false);
    }
  }

  async function removeUser(id: string) {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/admin-users/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Silme başarısız');
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Kullanıcı Yönetimi</h1>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Yeni kullanıcı tanımla</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Ad Soyad</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">E-posta</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Şifre</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Rol</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value === 'alt_bayi' ? 'alt_bayi' : 'admin')}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="admin">Admin</option>
              <option value="alt_bayi">Alt bayi</option>
            </select>
          </label>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Alt bayi yalnızca Villalar menüsünü görür ve sadece kendi eklediği villaları yönetebilir.
        </p>
        <div className="mt-3">
          <button
            type="button"
            disabled={creating}
            onClick={() => void createUser()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {creating ? 'Kaydediliyor...' : 'Kullanıcı Ekle'}
          </button>
        </div>
        {createError && <p className="mt-2 text-sm font-medium text-red-600">{createError}</p>}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold">E-posta</th>
                <th className="px-4 py-3 font-semibold">Rol</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Oluşturulma</th>
                <th className="px-4 py-3 font-semibold text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-zinc-100 dark:border-zinc-800/60">
                  <td className="px-4 py-3">{r.fullName}</td>
                  <td className="px-4 py-3">{r.email}</td>
                  <td className="px-4 py-3">{roleLabel(r.role)}</td>
                  <td className="px-4 py-3">{r.isActive ? 'Aktif' : 'Pasif'}</td>
                  <td className="px-4 py-3">{new Date(r.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void removeUser(r.id)}
                      className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-300"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                    Kullanıcı kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500">Yükleniyor...</p>}
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
