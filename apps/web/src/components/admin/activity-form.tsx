'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Star, X } from 'lucide-react';

import { DictionaryIcon } from '@/components/icons/dictionary-icon';
import { settingsToAdminDictionaries } from '@/lib/settings-to-dictionaries';
import type { ActivityBoatType, AdminActivity } from '@/types/admin-activity';
import type { AdminDictionaries } from '@/types/admin-dictionary';
import type { AdminSettings } from '@/types/admin-settings';

type Props =
  | { mode: 'create' }
  | { mode: 'edit'; activity: AdminActivity };

type FormFields = {
  name: string;
  companyName: string;
  documentNo: string;
  authorizedFullName: string;
  authorizedPhone: string;
  mainCategory: string;
  subCategoryIds: string[];
  location: string;
  departurePlace: string;
  description: string;
  tourProgram: string;
  includedItemIds: string[];
  excludedItemIds: string[];
  tagIds: string[];
  capacity: number;
  boatType: ActivityBoatType;
  askSell: boolean;
  prepaymentPercent: number;
  featureIds: string[];
  isActive: boolean;
};

export function ActivityForm(props: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const dict = useMemo(
    () => (settings ? settingsToAdminDictionaries(settings) : null),
    [settings],
  );

  const initial = useMemo((): FormFields => {
    if (props.mode === 'edit') {
      const a = props.activity;
      return {
        name: a.name,
        companyName: a.companyName ?? '',
        documentNo: a.documentNo ?? '',
        authorizedFullName: a.authorizedFullName ?? '',
        authorizedPhone: a.authorizedPhone ?? '',
        mainCategory: a.mainCategory,
        subCategoryIds: Array.isArray(a.subCategoryIds) ? a.subCategoryIds : [],
        location: a.location ?? '',
        departurePlace: a.departurePlace,
        description: a.description,
        tourProgram: a.tourProgram,
        includedItemIds: a.includedItemIds,
        excludedItemIds: a.excludedItemIds,
        tagIds: a.tagIds ?? [],
        capacity: a.capacity,
        boatType: a.boatType === 'family' ? 'family' : 'standard',
        askSell: Boolean(a.askSell),
        prepaymentPercent: typeof a.prepaymentPercent === 'number' ? a.prepaymentPercent : 100,
        featureIds: a.featureIds,
        isActive: a.isActive,
      };
    }
    return {
      name: '',
      companyName: '',
      documentNo: '',
      authorizedFullName: '',
      authorizedPhone: '',
      mainCategory: '',
      subCategoryIds: [],
      location: '',
      departurePlace: '',
      description: '',
      tourProgram: '',
      includedItemIds: [],
      excludedItemIds: [],
      tagIds: [],
      capacity: 0,
      boatType: 'standard',
      askSell: false,
      prepaymentPercent: 100,
      featureIds: [],
      isActive: true,
    };
  }, [props]);

  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('settings');
        return r.json() as Promise<{ settings: AdminSettings }>;
      })
      .then((data) => {
        if (!cancelled) setSettings(data.settings);
      })
      .catch(() => {
        if (!cancelled) setSettings(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const subOptions = dict?.subCategoriesByMain[form.mainCategory] ?? [];

  function toggleId(
    field: 'includedItemIds' | 'excludedItemIds' | 'featureIds' | 'tagIds' | 'subCategoryIds',
    id: string,
  ) {
    setForm((f) => {
      const set = new Set(f[field]);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, [field]: [...set] };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.subCategoryIds.length) {
      setError('En az bir alt kategori seçmelisiniz.');
      return;
    }
    setPending(true);
    try {
      if (props.mode === 'create') {
        const res = await fetch('/api/admin/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = (await res.json()) as { error?: string; activity?: AdminActivity };
        if (!res.ok) {
          setError(data.error ?? 'Kayıt başarısız');
          return;
        }
        router.push('/admin/aktiviteler');
        router.refresh();
        return;
      }

      const res = await fetch(`/api/admin/activities/${props.activity.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Güncelleme başarısız');
        return;
      }
      router.push('/admin/aktiviteler');
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {props.mode === 'edit' ? (
          <label className="block text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">Aktivite ID</span>
            <input
              readOnly
              className="mt-1 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              value={props.activity.activityId}
            />
          </label>
        ) : (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Aktivite ID</span>
            <p className="mt-1">Kayıt sırasında sistem tarafından otomatik atanır.</p>
          </div>
        )}
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Aktivite adı *</span>
          <input
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Firma adı</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Belge no</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.documentNo}
            onChange={(e) => setForm((f) => ({ ...f, documentNo: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Yetkili Ad-Soyad</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.authorizedFullName}
            onChange={(e) => setForm((f) => ({ ...f, authorizedFullName: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Yetkili Telefon</span>
          <input
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.authorizedPhone}
            onChange={(e) => setForm((f) => ({ ...f, authorizedPhone: e.target.value }))}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Ana kategori *</span>
          <select
            required
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.mainCategory}
            onChange={(e) =>
              setForm((f) => ({ ...f, mainCategory: e.target.value, subCategoryIds: [] }))
            }
          >
            <option value="">Seçin</option>
            {dict?.mainCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          {!dict?.mainCategories.length && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Ayarlar → Kategoriler sekmesinden ana kategori ekleyin.
            </p>
          )}
        </label>
        <div className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Alt kategoriler *</span>
          <div className="mt-1 max-h-44 space-y-2 overflow-auto rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50">
            {!form.mainCategory && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">Önce ana kategori seçin.</p>
            )}
            {form.mainCategory &&
              subOptions.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.subCategoryIds.includes(c.id)}
                    onChange={() => toggleId('subCategoryIds', c.id)}
                  />
                  {c.label}
                </label>
              ))}
          </div>
          {form.mainCategory && !!subOptions.length && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Birden fazla alt kategori seçebilirsiniz.
            </p>
          )}
          {form.mainCategory && !subOptions.length && (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
              Bu kategori için Ayarlar → Kategoriler’den alt kategori ekleyin.
            </p>
          )}
        </div>
      </div>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Lokasyon *</span>
        <input
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          placeholder="Örn. Bodrum"
          value={form.location}
          onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Kalkış yeri *</span>
        <input
          required
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          value={form.departurePlace}
          onChange={(e) => setForm((f) => ({ ...f, departurePlace: e.target.value }))}
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Açıklama *</span>
        <textarea
          required
          rows={4}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />
      </label>

      <label className="block text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">Tur programı *</span>
        <textarea
          required
          rows={5}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
          value={form.tourProgram}
          onChange={(e) => setForm((f) => ({ ...f, tourProgram: e.target.value }))}
        />
      </label>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-emerald-200/90 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/25">
          <div className="mb-3 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-200">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm dark:bg-emerald-500">
              <CheckCircle2 className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="text-base font-semibold leading-tight">Dahil olan hizmetler</span>
          </div>
          <p className="mb-3 text-xs text-emerald-900/75 dark:text-emerald-300/85">
            Ayarlar → Sözlük (dahil olanlar). Lucide çizgi ikonları.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {dict?.includes.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-emerald-200/70 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-emerald-900/35 dark:bg-zinc-900/90"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-zinc-300"
                  checked={form.includedItemIds.includes(item.id)}
                  onChange={() => toggleId('includedItemIds', item.id)}
                />
                <DictionaryIcon
                  iconKey={item.iconKey}
                  fallbackEmoji={item.icon}
                  className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                />
                <span className="text-zinc-800 dark:text-zinc-100">{item.label}</span>
              </label>
            ))}
            {!dict?.includes.length && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ayarlar → Sözlük’ten kayıt ekleyin.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/40">
          <div className="mb-3 flex items-center gap-2.5 text-zinc-800 dark:text-zinc-100">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-600 text-white shadow-sm dark:bg-zinc-500">
              <X className="h-5 w-5" strokeWidth={2.25} aria-hidden />
            </span>
            <span className="text-base font-semibold leading-tight">Dahil olmayan hizmetler</span>
          </div>
          <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
            Ayarlar → Sözlük (dahil olmayanlar).
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {dict?.excludes.map((item) => (
              <label
                key={item.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-zinc-600 dark:bg-zinc-900/90"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-zinc-300"
                  checked={form.excludedItemIds.includes(item.id)}
                  onChange={() => toggleId('excludedItemIds', item.id)}
                />
                <DictionaryIcon
                  iconKey={item.iconKey}
                  fallbackEmoji={item.icon}
                  className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                />
                <span className="text-zinc-800 dark:text-zinc-100">{item.label}</span>
              </label>
            ))}
            {!dict?.excludes.length && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Ayarlar → Sözlük’ten kayıt ekleyin.
              </p>
            )}
          </div>
        </div>
      </div>

      <fieldset className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
        <legend className="px-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
          Etiketler
        </legend>
        <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
          Ayarlar → Etiket’ten tanımlanan etiketler.
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {settings?.tags.map((t) => (
            <label key={t.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.tagIds.includes(t.id)}
                onChange={() => toggleId('tagIds', t.id)}
              />
              {t.name}
            </label>
          ))}
          {!settings?.tags.length && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ayarlar → Etiket’ten etiket ekleyin.
            </p>
          )}
        </div>
      </fieldset>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 dark:border-amber-900/35 dark:bg-amber-950/20">
        <div className="mb-3 flex items-center gap-2.5 text-amber-900 dark:text-amber-100">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm dark:bg-amber-600">
            <Star className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </span>
          <span className="text-base font-semibold leading-tight">Özellikler</span>
        </div>
        <p className="mb-3 text-xs text-amber-900/70 dark:text-amber-200/80">
          Ayarlar → Sözlük (özellikler grubu).
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {dict?.features.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-amber-200/60 bg-white px-3 py-2.5 text-sm shadow-sm dark:border-amber-900/30 dark:bg-zinc-900/90"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 rounded border-zinc-300"
                checked={form.featureIds.includes(item.id)}
                onChange={() => toggleId('featureIds', item.id)}
              />
              <DictionaryIcon
                iconKey={item.iconKey}
                fallbackEmoji={item.icon}
                className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
              />
              <span className="text-zinc-800 dark:text-zinc-100">{item.label}</span>
            </label>
          ))}
          {!dict?.features.length && (
            <p className="col-span-full text-sm text-zinc-500 dark:text-zinc-400">
              Ayarlar → Sözlük’ten (özellikler) kayıt ekleyin.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Kapasite (kişi)</span>
          <input
            type="number"
            min={0}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.capacity}
            onChange={(e) =>
              setForm((f) => ({ ...f, capacity: Math.max(0, Number(e.target.value) || 0) }))
            }
          />
        </label>
        <fieldset className="block text-sm">
          <legend className="text-zinc-600 dark:text-zinc-400">Tekne Türü</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:text-zinc-100">
              <input
                type="radio"
                name="boatType"
                checked={form.boatType === 'family'}
                onChange={() => setForm((f) => ({ ...f, boatType: 'family' }))}
              />
              Aile Teknesi
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:text-zinc-100">
              <input
                type="radio"
                name="boatType"
                checked={form.boatType === 'standard'}
                onChange={() => setForm((f) => ({ ...f, boatType: 'standard' }))}
              />
              Standart Tekne
            </label>
          </div>
        </fieldset>
        <label className="block text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Ön Ödeme Oranı (%)</span>
          <input
            type="number"
            min={1}
            max={100}
            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
            value={form.prepaymentPercent}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                prepaymentPercent: Math.min(100, Math.max(1, Number(e.target.value) || 100)),
              }))
            }
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Ödeme adımında tahsil edilecek tutar bu oranla hesaplanır.
          </p>
        </label>
        <div className="space-y-3 pt-2 sm:pt-8">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.askSell}
              onChange={(e) => setForm((f) => ({ ...f, askSell: e.target.checked }))}
            />
            <span className="text-zinc-800 dark:text-zinc-200">Sor Sat</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span className="text-zinc-800 dark:text-zinc-200">Durum: Aktif</span>
          </label>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {pending ? 'Kaydediliyor…' : props.mode === 'create' ? 'Kaydet' : 'Güncelle'}
        </button>
        <Link
          href="/admin/aktiviteler"
          className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}
