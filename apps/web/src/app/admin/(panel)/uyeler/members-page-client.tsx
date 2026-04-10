'use client';

import { useCallback, useEffect, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';

type Member = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  kvkkConsent: boolean;
  smsConsent: boolean;
  createdAt: string;
  updatedAt: string;
};

type MembersResponse = {
  members: Member[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const PAGE_SIZE = 25;

export function MembersPageClient() {
  const [q, setQ] = useState('');
  const [kvkk, setKvkk] = useState('');
  const [sms, setSms] = useState('');
  const dq = useDebounced(q, 300);

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Member[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    kvkkConsent: false,
    smsConsent: false,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    kvkkConsent: boolean;
    smsConsent: boolean;
  } | null>(null);

  useEffect(() => setPage(1), [dq, kvkk, sms]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dq) params.set('q', dq);
    if (kvkk) params.set('kvkk', kvkk);
    if (sms) params.set('sms', sms);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/members?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as MembersResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Üyeler alınamadı');
      setRows(data.members);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [dq, kvkk, sms, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function beginEdit(m: Member) {
    setEditingId(m.id);
    setEditForm({
      fullName: m.fullName,
      email: m.email,
      phone: m.phone,
      kvkkConsent: m.kvkkConsent,
      smsConsent: m.smsConsent,
    });
  }

  async function createMember() {
    setCreateError(null);
    if (!createForm.fullName.trim() || !createForm.email.trim() || !createForm.phone.trim() || !createForm.password) {
      setCreateError('Ad soyad, e-posta, telefon ve şifre zorunludur.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(createForm),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? 'Kullanıcı oluşturulamadı');
        return;
      }
      setCreateForm({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        kvkkConsent: false,
        smsConsent: false,
      });
      setPage(1);
      void load();
    } catch {
      setCreateError('Ağ hatası.');
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit() {
    if (!editingId || !editForm) return;
    const res = await fetch(`/api/admin/members/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(editForm),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Güncelleme başarısız');
      return;
    }
    setEditingId(null);
    setEditForm(null);
    void load();
  }

  async function removeMember(id: string) {
    if (!confirm('Bu üyeyi silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/members/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Silme başarısız');
      return;
    }
    void load();
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

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
              value={createForm.fullName}
              onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">E-posta</span>
            <input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Telefon</span>
            <input
              value={createForm.phone}
              onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Şifre</span>
            <input
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={createForm.kvkkConsent}
              onChange={(e) => setCreateForm((f) => ({ ...f, kvkkConsent: e.target.checked }))}
            />
            KVKK Onayı
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={createForm.smsConsent}
              onChange={(e) => setCreateForm((f) => ({ ...f, smsConsent: e.target.checked }))}
            />
            SMS Onayı
          </label>
          <button
            type="button"
            disabled={creating}
            onClick={() => void createMember()}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {creating ? 'Kaydediliyor...' : 'Kullanıcı Ekle'}
          </button>
        </div>
        {createError && <p className="mt-2 text-sm font-medium text-red-600">{createError}</p>}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Arama</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ad, e-posta, telefon"
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">KVKK Onayı</span>
            <select
              value={kvkk}
              onChange={(e) => setKvkk(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Tümü</option>
              <option value="true">Onaylı</option>
              <option value="false">Onaysız</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">SMS Onayı</span>
            <select
              value={sms}
              onChange={(e) => setSms(e.target.value)}
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            >
              <option value="">Tümü</option>
              <option value="true">Onaylı</option>
              <option value="false">Onaysız</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
                <th className="px-4 py-3 font-semibold">Ad Soyad</th>
                <th className="px-4 py-3 font-semibold">E-posta</th>
                <th className="px-4 py-3 font-semibold">Telefon</th>
                <th className="px-4 py-3 font-semibold">KVKK</th>
                <th className="px-4 py-3 font-semibold">SMS</th>
                <th className="px-4 py-3 font-semibold">Kayıt</th>
                <th className="px-4 py-3 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <tr key={m.id} className="border-b border-zinc-100 align-top dark:border-zinc-800/60">
                  <td className="px-4 py-3">
                    {editingId === m.id && editForm ? (
                      <input
                        value={editForm.fullName}
                        onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                        className="min-h-9 w-52 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    ) : (
                      m.fullName
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === m.id && editForm ? (
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="min-h-9 w-56 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    ) : (
                      m.email
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === m.id && editForm ? (
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="min-h-9 w-40 rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    ) : (
                      m.phone
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === m.id && editForm ? (
                      <input
                        type="checkbox"
                        checked={editForm.kvkkConsent}
                        onChange={(e) => setEditForm({ ...editForm, kvkkConsent: e.target.checked })}
                      />
                    ) : m.kvkkConsent ? (
                      'Evet'
                    ) : (
                      'Hayır'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === m.id && editForm ? (
                      <input
                        type="checkbox"
                        checked={editForm.smsConsent}
                        onChange={(e) => setEditForm({ ...editForm, smsConsent: e.target.checked })}
                      />
                    ) : m.smsConsent ? (
                      'Evet'
                    ) : (
                      'Hayır'
                    )}
                  </td>
                  <td className="px-4 py-3">{new Date(m.createdAt).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 text-right">
                    {editingId === m.id ? (
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                        >
                          Kaydet
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditForm(null);
                          }}
                          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                        >
                          İptal
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          onClick={() => beginEdit(m)}
                          className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => removeMember(m.id)}
                          className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-300"
                        >
                          Sil
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500">
          {loading ? 'Yükleniyor...' : `${from}-${to} / ${total} kayıt`}
        </p>
        <div className="inline-flex items-center gap-2">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Önceki
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {page}/{Math.max(1, totalPages)}
          </span>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            Sonraki
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

