'use client';

import { useCallback, useEffect, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';
import type { FaqItem } from '@/types/faq';

export function FaqManagementClient() {
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState('');
  const dq = useDebounced(q, 300);

  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newIsActive, setNewIsActive] = useState(true);
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editActive, setEditActive] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dq) params.set('q', dq);
    if (isActive) params.set('isActive', isActive);
    try {
      const res = await fetch(`/api/admin/faqs?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as { error?: string; faqs?: FaqItem[] };
      if (!res.ok) throw new Error(data.error ?? 'SSS alınamadı');
      setItems(Array.isArray(data.faqs) ? data.faqs : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [dq, isActive]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addFaq() {
    const question = newQuestion.trim();
    const answer = newAnswer.trim();
    if (!question || !answer) {
      alert('Soru ve cevap zorunludur.');
      return;
    }
    setAdding(true);
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ question, answer, isActive: newIsActive }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        alert(data.error ?? 'Eklenemedi');
        return;
      }
      setNewQuestion('');
      setNewAnswer('');
      setNewIsActive(true);
      void load();
    } finally {
      setAdding(false);
    }
  }

  function beginEdit(item: FaqItem) {
    setEditingId(item.id);
    setEditQuestion(item.question);
    setEditAnswer(item.answer);
    setEditActive(item.isActive);
  }

  async function saveEdit(item: FaqItem) {
    const question = editQuestion.trim();
    const answer = editAnswer.trim();
    if (!question || !answer) {
      alert('Soru ve cevap zorunludur.');
      return;
    }
    const res = await fetch(`/api/admin/faqs/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ question, answer, isActive: editActive }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Güncellenemedi');
      return;
    }
    setEditingId(null);
    void load();
  }

  async function remove(item: FaqItem) {
    if (!confirm('Bu S.S.S. kaydını silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/faqs/${item.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Silinemedi');
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">S.S.S. Yönetimi</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Sık sorulan soruları buradan ekleyip düzenleyebilirsiniz.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Yeni soru ekle</p>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Soru</span>
            <input
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Cevap</span>
            <textarea
              rows={3}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={newIsActive} onChange={(e) => setNewIsActive(e.target.checked)} />
            Aktif
          </label>
          <button
            type="button"
            onClick={() => void addFaq()}
            disabled={adding}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {adding ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Arama</span>
            <input
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Soru veya cevapta ara"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Durum</span>
            <select
              className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-3">
        {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>}
        {!loading && items.length === 0 && (
          <p className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            Kayıt bulunamadı.
          </p>
        )}
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            {editingId === item.id ? (
              <div className="space-y-3">
                <label className="block text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Soru</span>
                  <input
                    className="mt-1 min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-500 dark:text-zinc-400">Cevap</span>
                  <textarea
                    rows={4}
                    className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} />
                    Aktif
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void saveEdit(item)}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-600"
                    >
                      Kaydet
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-600"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{item.question}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      item.isActive
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                    }`}
                  >
                    {item.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.answer}</p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => beginEdit(item)}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-600"
                  >
                    Düzenle
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(item)}
                    className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-300"
                  >
                    Sil
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

