'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { IconPicker } from '@/components/admin/icon-picker';
import type { DictionaryIconKey } from '@/components/icons/dictionary-icon';
import { DictionaryIcon } from '@/components/icons/dictionary-icon';
import { slugifyId, uniqueSlug } from '@/lib/slugify-id';
import {
  SITE_PRODUCT_OPTIONS,
  normalizeEnabledSiteProducts,
  type SiteProductType,
} from '@/lib/site-product-types';
import type { AdminSettings, DictionaryGroup } from '@/types/admin-settings';

type TabId =
  | 'sozluk'
  | 'etiket'
  | 'kategori'
  | 'site'
  | 'banner'
  | 'payment'
  | 'mail'
  | 'social'
  | 'footer'
  | 'blok';

const GROUP_LABEL: Record<DictionaryGroup, string> = {
  include: 'Dahil olanlar',
  exclude: 'Dahil olmayanlar',
  feature: 'Özellikler',
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'sozluk', label: 'Sözlük' },
  { id: 'etiket', label: 'Etiket' },
  { id: 'kategori', label: 'Kategoriler' },
  { id: 'site', label: 'Site Yönetimi' },
  { id: 'banner', label: 'Banner Yönetimi' },
  { id: 'payment', label: 'Ödeme Yönetimi' },
  { id: 'mail', label: 'Mail Şablon Yönetimi' },
  { id: 'social', label: 'Sosyal Medya' },
  { id: 'footer', label: 'Footer Yönetimi' },
  { id: 'blok', label: 'Blok yönetimi' },
];

export function SettingsPageClient() {
  const [tab, setTab] = useState<TabId>('sozluk');
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [blockTab, setBlockTab] = useState<'kategoriBanner' | 'other'>('kategoriBanner');
  const [villaRegions, setVillaRegions] = useState<string[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [regionsReloadTick, setRegionsReloadTick] = useState(0);

  const [dictIconKey, setDictIconKey] = useState<DictionaryIconKey>('Utensils');
  const [dictLabel, setDictLabel] = useState('');
  const [dictGroup, setDictGroup] = useState<DictionaryGroup>('include');

  const [tagName, setTagName] = useState('');

  const [catName, setCatName] = useState('');
  const [catCoverImageUrl, setCatCoverImageUrl] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [subByCat, setSubByCat] = useState<Record<string, string>>({});
  const [subCoverByCat, setSubCoverByCat] = useState<Record<string, string>>({});
  const [subDescriptionByCat, setSubDescriptionByCat] = useState<Record<string, string>>({});

  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCtaText, setBannerCtaText] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [rightTitle, setRightTitle] = useState('');
  const [rightSubtitle, setRightSubtitle] = useState('');
  const [rightGooglePlayUrl, setRightGooglePlayUrl] = useState('');
  const [rightAppStoreUrl, setRightAppStoreUrl] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) {
      setError('Ayarlar yüklenemedi');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { settings: AdminSettings };
    setSettings(data.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!settings) return;
    const rb = settings.bannerManagement?.rightBanner;
    setRightTitle(rb?.title ?? '');
    setRightSubtitle(rb?.subtitle ?? '');
    setRightGooglePlayUrl(rb?.storeBadges?.googlePlayUrl ?? '');
    setRightAppStoreUrl(rb?.storeBadges?.appStoreUrl ?? '');
  }, [settings?.bannerManagement?.rightBanner]);

  useEffect(() => {
    if (tab !== 'blok') return;
    let cancelled = false;

    async function loadAllVillaRegions() {
      setRegionsLoading(true);
      setError(null);
      try {
        const regions = new Set<string>();
        let page = 1;
        let totalPages = 1;
        while (page <= totalPages) {
          const res = await fetch(`/api/admin/villas?isActive=true&pageSize=100&page=${page}`, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (!res.ok) {
            setError('Villa bölgeleri yüklenemedi');
            return;
          }
          const data = (await res.json()) as {
            villas: { region: string }[];
            totalPages: number;
          };
          totalPages = Number(data.totalPages ?? 1) || 1;
          for (const v of data.villas ?? []) {
            const r = String(v?.region ?? '').trim();
            if (r) regions.add(r);
          }
          page += 1;
        }

        const list = Array.from(regions).sort((a, b) => a.localeCompare(b, 'tr'));
        if (!cancelled) setVillaRegions(list);
      } finally {
        if (!cancelled) setRegionsLoading(false);
      }
    }

    void loadAllVillaRegions();
    return () => {
      cancelled = true;
    };
  }, [tab, regionsReloadTick]);

  async function save(next: AdminSettings) {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { error?: string; settings?: AdminSettings };
      if (!res.ok) {
        setError(data.error ?? 'Kaydedilemedi');
        return;
      }
      if (data.settings) setSettings(data.settings);
      setOk('Kaydedildi');
      setTimeout(() => setOk(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function uploadCoverFile(file: File, folder: string, key: string): Promise<string | null> {
    setUploadingKey(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('folder', folder);
      const res = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Kapak resmi yuklenemedi');
        return null;
      }
      return data.url;
    } finally {
      setUploadingKey(null);
    }
  }

  function addSliderBanner() {
    if (!settings) return;
    setError(null);
    const title = bannerTitle.trim();
    if (!title) {
      setError('Banner başlığı girin');
      return;
    }
    if (!bannerImageUrl.trim()) {
      setError('Banner görseli yükleyin');
      return;
    }
    const id = crypto.randomUUID();
    const next: AdminSettings = {
      ...settings,
      bannerManagement: {
        sliderBanners: [
          ...((settings.bannerManagement?.sliderBanners ?? []).slice()),
          {
            id,
            imageUrl: bannerImageUrl.trim(),
            title,
            subtitle: bannerSubtitle.trim(),
            ...(bannerCtaText.trim() ? { ctaText: bannerCtaText.trim() } : {}),
          },
        ],
        rightBanner: settings.bannerManagement?.rightBanner,
      },
    };
    setSettings(next);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerCtaText('');
    setBannerImageUrl('');
    void save(next);
  }

  function removeSliderBanner(id: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      bannerManagement: {
        sliderBanners: (settings.bannerManagement?.sliderBanners ?? []).filter((b) => b.id !== id),
        rightBanner: settings.bannerManagement?.rightBanner,
      },
    };
    setSettings(next);
    void save(next);
  }

  function updateRightBanner(partial: NonNullable<AdminSettings['bannerManagement']>['rightBanner']) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      bannerManagement: {
        sliderBanners: (settings.bannerManagement?.sliderBanners ?? []).slice(),
        rightBanner: partial,
      },
    };
    setSettings(next);
  }

  function saveRightBanner() {
    if (!settings) return;
    const currentRight = settings.bannerManagement?.rightBanner ?? {};
    const nextRight: NonNullable<AdminSettings['bannerManagement']>['rightBanner'] = {
      ...(currentRight.imageUrl ? { imageUrl: currentRight.imageUrl } : {}),
      ...(rightTitle.trim() ? { title: rightTitle.trim() } : {}),
      ...(rightSubtitle.trim() ? { subtitle: rightSubtitle.trim() } : {}),
      storeBadges: {
        ...(rightGooglePlayUrl.trim() ? { googlePlayUrl: rightGooglePlayUrl.trim() } : {}),
        ...(rightAppStoreUrl.trim() ? { appStoreUrl: rightAppStoreUrl.trim() } : {}),
      },
    };
    const next: AdminSettings = {
      ...settings,
      bannerManagement: {
        sliderBanners: (settings.bannerManagement?.sliderBanners ?? []).slice(),
        rightBanner: nextRight,
      },
    };
    setSettings(next);
    void save(next);
  }

  const categoryIds = useMemo(() => new Set(settings?.categories.map((c) => c.id) ?? []), [settings]);

  function addDictionary() {
    if (!settings) return;
    setError(null);
    const label = dictLabel.trim();
    if (!label) {
      setError('Sözlük adı girin');
      return;
    }
    const id = crypto.randomUUID();
    const next: AdminSettings = {
      ...settings,
      dictionaries: [
        ...settings.dictionaries,
        { id, icon: '', iconKey: dictIconKey, label, group: dictGroup },
      ],
    };
    setSettings(next);
    setDictLabel('');
    void save(next);
  }

  function removeDictionary(id: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      dictionaries: settings.dictionaries.filter((d) => d.id !== id),
    };
    setSettings(next);
    void save(next);
  }

  function addTag() {
    if (!settings) return;
    setError(null);
    const name = tagName.trim();
    if (!name) {
      setError('Etiket adı girin');
      return;
    }
    const id = crypto.randomUUID();
    const next: AdminSettings = {
      ...settings,
      tags: [...settings.tags, { id, name }],
    };
    setSettings(next);
    setTagName('');
    void save(next);
  }

  function removeTag(id: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      tags: settings.tags.filter((t) => t.id !== id),
    };
    setSettings(next);
    void save(next);
  }

  function addCategory() {
    if (!settings) return;
    setError(null);
    const name = catName.trim();
    if (!name) {
      setError('Kategori adı girin');
      return;
    }
    const base = slugifyId(name);
    const id = uniqueSlug(base, categoryIds);
    const next: AdminSettings = {
      ...settings,
      categories: [
        ...settings.categories,
        {
          id,
          name,
          coverImageUrl: catCoverImageUrl.trim(),
          description: catDescription.trim(),
          subcategories: [],
        },
      ],
    };
    setSettings(next);
    setCatName('');
    setCatCoverImageUrl('');
    setCatDescription('');
    void save(next);
  }

  function removeCategory(catId: string) {
    if (!settings) return;
    if (!confirm('Bu kategoriyi ve alt kategorilerini silmek istediğinize emin misiniz?')) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.filter((c) => c.id !== catId),
    };
    setSettings(next);
    void save(next);
  }

  function updateCategoryName(catId: string, name: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) => (c.id === catId ? { ...c, name } : c)),
    };
    setSettings(next);
  }

  function saveCategoryName(catId: string, name: string) {
    if (!settings) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) => (c.id === catId ? { ...c, name: trimmed } : c)),
    };
    setSettings(next);
    void save(next);
  }

  // Kapak resmi artık dosya yükleme ile yönetilir.

  async function uploadCategoryCover(catId: string, file: File) {
    const url = await uploadCoverFile(file, 'categories', `cat:${catId}`);
    if (!url || !settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) => (c.id === catId ? { ...c, coverImageUrl: url } : c)),
    };
    setSettings(next);
    void save(next);
  }

  function updateCategoryDescription(catId: string, description: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) => (c.id === catId ? { ...c, description } : c)),
    };
    setSettings(next);
  }

  function saveCategoryDescription(catId: string, description: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId ? { ...c, description: description.trim() } : c,
      ),
    };
    setSettings(next);
    void save(next);
  }

  function addSubcategory(catId: string) {
    if (!settings) return;
    setError(null);
    const raw = (subByCat[catId] ?? '').trim();
    if (!raw) {
      setError('Alt kategori adı girin');
      return;
    }
    const cat = settings.categories.find((c) => c.id === catId);
    if (!cat) return;
    const used = new Set(cat.subcategories.map((s) => s.id));
    const base = slugifyId(raw);
    const sid = uniqueSlug(base, used);
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: [
                ...c.subcategories,
                {
                  id: sid,
                  name: raw,
                  coverImageUrl: (subCoverByCat[catId] ?? '').trim(),
                  description: (subDescriptionByCat[catId] ?? '').trim(),
                },
              ],
            }
          : c,
      ),
    };
    setSettings(next);
    setSubByCat((s) => ({ ...s, [catId]: '' }));
    setSubCoverByCat((s) => ({ ...s, [catId]: '' }));
    setSubDescriptionByCat((s) => ({ ...s, [catId]: '' }));
    void save(next);
  }

  function removeSubcategory(catId: string, subId: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) }
          : c,
      ),
    };
    setSettings(next);
    void save(next);
  }

  function updateSubName(catId: string, subId: string, name: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, name } : s,
              ),
            }
          : c,
      ),
    };
    setSettings(next);
  }

  function saveSubName(catId: string, subId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, name: trimmed } : s,
              ),
            }
          : c,
      ),
    };
    setSettings(next);
    void save(next);
  }

  // Alt kategori kapak resmi artık dosya yükleme ile yönetilir.

  async function uploadSubCover(catId: string, subId: string, file: File) {
    const url = await uploadCoverFile(file, 'subcategories', `sub:${catId}:${subId}`);
    if (!url || !settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, coverImageUrl: url } : s,
              ),
            }
          : c,
      ),
    };
    setSettings(next);
    void save(next);
  }

  function updateSubDescription(catId: string, subId: string, description: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, description } : s,
              ),
            }
          : c,
      ),
    };
    setSettings(next);
  }

  function saveSubDescription(catId: string, subId: string, description: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      categories: settings.categories.map((c) =>
        c.id === catId
          ? {
              ...c,
              subcategories: c.subcategories.map((s) =>
                s.id === subId ? { ...s, description: description.trim() } : s,
              ),
            }
          : c,
      ),
    };
    setSettings(next);
    void save(next);
  }

  if (loading || !settings) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Yükleniyor…'}</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">Ayarlar</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sözlük, etiket ve kategori tanımları aktivite formunda kullanılır.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {ok}
        </div>
      )}

      <div
        className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0"
        role="tablist"
        aria-label="Ayar sekmeleri"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition min-h-11 ${
              tab === t.id
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
        role="tabpanel"
      >
        {tab === 'sozluk' && (
          <div className="space-y-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Lucide çizgi ikonlarından seçin, ardından sözlük adını yazıp ekleyin.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm sm:col-span-1">
                <span className="text-zinc-600 dark:text-zinc-400">Grup</span>
                <select
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={dictGroup}
                  onChange={(e) => setDictGroup(e.target.value as DictionaryGroup)}
                >
                  {(Object.keys(GROUP_LABEL) as DictionaryGroup[]).map((g) => (
                    <option key={g} value={g}>
                      {GROUP_LABEL[g]}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-2">
                <IconPicker value={dictIconKey} onChange={setDictIconKey} />
              </div>
            </div>

            <label className="block text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Sözlük adı</span>
              <input
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                value={dictLabel}
                onChange={(e) => setDictLabel(e.target.value)}
                placeholder="Örn. Öğle yemeği"
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={() => addDictionary()}
              className="min-h-11 w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
            >
              {saving ? 'Kaydediliyor…' : 'Sözlük öğesi ekle'}
            </button>

            {(Object.keys(GROUP_LABEL) as DictionaryGroup[]).map((g) => (
              <section key={g} className="border-t border-zinc-200 pt-6 dark:border-zinc-700">
                <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                  {GROUP_LABEL[g]}
                </h2>
                <ul className="mt-3 space-y-2">
                  {settings.dictionaries.filter((d) => d.group === g).length === 0 && (
                    <li className="text-sm text-zinc-500 dark:text-zinc-400">Henüz kayıt yok.</li>
                  )}
                  {settings.dictionaries
                    .filter((d) => d.group === g)
                    .map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                      >
                        <span className="flex min-w-0 items-center gap-3 text-sm">
                          <DictionaryIcon
                            iconKey={d.iconKey}
                            fallbackEmoji={d.icon || undefined}
                            className="h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300"
                          />
                          <span className="truncate text-zinc-800 dark:text-zinc-200">{d.label}</span>
                          <span className="font-mono text-xs text-zinc-400">{d.id.slice(0, 8)}…</span>
                        </span>
                        <button
                          type="button"
                          className="min-h-10 shrink-0 rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                          onClick={() => removeDictionary(d.id)}
                        >
                          Sil
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {tab === 'etiket' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Etiket isimlerini burada tanımlayın (ileride aktivite ve listelerde kullanılabilir).
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Etiket adı</span>
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Yeni etiket"
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => addTag()}
                className="min-h-11 shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                Ekle
              </button>
            </div>
            <ul className="space-y-2">
              {settings.tags.length === 0 && (
                <li className="text-sm text-zinc-500 dark:text-zinc-400">Henüz etiket yok.</li>
              )}
              {settings.tags.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700"
                >
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{t.name}</span>
                  <button
                    type="button"
                    className="min-h-10 rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                    onClick={() => removeTag(t.id)}
                  >
                    Sil
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'kategori' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ana kategoriler ve her birinin alt kategorileri aktivite formundaki seçimlere yansır.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Yeni ana kategori</span>
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Orn. Deniz"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Kapak resmi dosyasi</span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    void uploadCoverFile(file, 'categories', 'cat:new').then((url) => {
                      if (url) setCatCoverImageUrl(url);
                    });
                    e.currentTarget.value = '';
                  }}
                />
                {catCoverImageUrl && (
                  <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{catCoverImageUrl}</p>
                )}
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-zinc-600 dark:text-zinc-400">Kategori açıklaması</span>
                <textarea
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Kategori aciklama metni..."
                />
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => addCategory()}
                className="min-h-11 shrink-0 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white sm:col-span-2 dark:bg-zinc-100 dark:text-zinc-900"
              >
                Kategori ekle
              </button>
            </div>

            <div className="space-y-6">
              {settings.categories.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <label className="block text-xs text-zinc-500 dark:text-zinc-400">
                        Kategori adı
                      </label>
                      <input
                        className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                        value={c.name}
                        onChange={(e) => updateCategoryName(c.id, e.target.value)}
                        onBlur={(e) => saveCategoryName(c.id, e.target.value)}
                      />
                      <p className="mt-1 font-mono text-xs text-zinc-400">Kimlik: {c.id}</p>
                      <label className="block text-xs text-zinc-500 dark:text-zinc-400">
                        Kapak resmi dosyasi
                      </label>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          className="min-h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void uploadCategoryCover(c.id, file);
                            e.currentTarget.value = '';
                          }}
                        />
                        {c.coverImageUrl ? (
                          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{c.coverImageUrl}</p>
                        ) : (
                          <p className="text-xs text-zinc-400">Kapak resmi secilmedi.</p>
                        )}
                      </div>
                      <label className="block text-xs text-zinc-500 dark:text-zinc-400">
                        Kategori açıklaması
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                        value={c.description ?? ''}
                        onChange={(e) => updateCategoryDescription(c.id, e.target.value)}
                        onBlur={(e) => saveCategoryDescription(c.id, e.target.value)}
                        placeholder="Kullanici arayuzunde gosterilecek aciklama"
                      />
                    </div>
                    <button
                      type="button"
                      className="min-h-10 shrink-0 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
                      onClick={() => removeCategory(c.id)}
                    >
                      Kategoriyi sil
                    </button>
                  </div>

                  <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      Alt kategoriler
                    </p>
                    <ul className="mt-2 space-y-2">
                      {c.subcategories.map((s) => (
                        <li key={s.id} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              className="min-h-10 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                              value={s.name}
                              onChange={(e) => updateSubName(c.id, s.id, e.target.value)}
                              onBlur={(e) => saveSubName(c.id, s.id, e.target.value)}
                            />
                            <span className="font-mono text-xs text-zinc-400">{s.id}</span>
                            <button
                              type="button"
                              className="min-h-10 rounded border border-red-300 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                              onClick={() => removeSubcategory(c.id, s.id)}
                            >
                              Sil
                            </button>
                          </div>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            <input
                              type="file"
                              accept="image/*"
                              className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                void uploadSubCover(c.id, s.id, file);
                                e.currentTarget.value = '';
                              }}
                            />
                            {s.coverImageUrl && (
                              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400 sm:col-span-2">
                                {s.coverImageUrl}
                              </p>
                            )}
                            <textarea
                              rows={2}
                              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                              value={s.description ?? ''}
                              onChange={(e) => updateSubDescription(c.id, s.id, e.target.value)}
                              onBlur={(e) => saveSubDescription(c.id, s.id, e.target.value)}
                              placeholder="Alt kategori aciklamasi"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <label className="block text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Yeni alt kategori</span>
                        <input
                          className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                          value={subByCat[c.id] ?? ''}
                          onChange={(e) =>
                            setSubByCat((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          placeholder="Alt kategori adı"
                        />
                      </label>
                      <label className="block text-sm">
                        <span className="text-zinc-500 dark:text-zinc-400">Kapak resmi dosyasi</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void uploadCoverFile(file, 'subcategories', `sub:new:${c.id}`).then((url) => {
                              if (url) setSubCoverByCat((prev) => ({ ...prev, [c.id]: url }));
                            });
                            e.currentTarget.value = '';
                          }}
                        />
                        {(subCoverByCat[c.id] ?? '') && (
                          <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                            {subCoverByCat[c.id]}
                          </p>
                        )}
                      </label>
                      <label className="block text-sm sm:col-span-2">
                        <span className="text-zinc-500 dark:text-zinc-400">Açıklama</span>
                        <textarea
                          rows={2}
                          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                          value={subDescriptionByCat[c.id] ?? ''}
                          onChange={(e) =>
                            setSubDescriptionByCat((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          placeholder="Alt kategori aciklamasi"
                        />
                      </label>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => addSubcategory(c.id)}
                        className="min-h-11 shrink-0 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium sm:col-span-2 dark:border-zinc-600"
                      >
                        Alt kategori ekle
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'site' && (
          <div className="space-y-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Logo, WhatsApp balonu ve ana sayfa slider içeriklerini buradan yönetebilirsiniz.
            </p>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Açık iş hatları</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Hangi ürün gruplarının sitede ve yönetim panelinde kullanılacağını seçin.{' '}
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">Aktivite</strong> mevcut tur
                listeleri ve ana sayfa aktivite bileşenlerini;{' '}
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">Villa kiralama</strong> villalar
                menüsünü ve villa ana sayfa alanlarını;{' '}
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">Tekne turu</strong> tekne odaklı
                içerik bloklarını açar.
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {SITE_PRODUCT_OPTIONS.map((opt) => {
                  const enabled = normalizeEnabledSiteProducts(settings?.siteManagement?.enabledSiteProducts);
                  const checked = enabled.includes(opt.id);
                  return (
                    <label
                      key={opt.id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300"
                        checked={checked}
                        disabled={saving || !settings}
                        onChange={(e) => {
                          if (!settings) return;
                          const set = new Set<SiteProductType>(enabled);
                          if (e.target.checked) {
                            set.add(opt.id);
                          } else {
                            set.delete(opt.id);
                          }
                          const ordered = SITE_PRODUCT_OPTIONS.map((o) => o.id).filter((id) => set.has(id));
                          const nextProducts = normalizeEnabledSiteProducts(ordered);
                          const next: AdminSettings = {
                            ...settings,
                            siteManagement: {
                              ...(settings.siteManagement ?? { slides: [] }),
                              logoUrl: settings.siteManagement?.logoUrl ?? '',
                              darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                              slides: (settings.siteManagement?.slides ?? []).slice(),
                              enabledSiteProducts: nextProducts,
                            },
                          };
                          setSettings(next);
                          void save(next);
                        }}
                      />
                      {opt.label}
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Site logosu</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Normal logo açık (beyaz) header’da, koyu zemin logosu şeffaf/koyu header’da kullanılacak.
              </p>
              <div className="mt-3 grid gap-3 lg:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Normal logo</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !settings) return;
                      void uploadCoverFile(file, 'site', 'site:logo').then((url) => {
                        if (!url) return;
                        const next: AdminSettings = {
                          ...settings,
                          siteManagement: {
                            ...(settings.siteManagement ?? { slides: [] }),
                            logoUrl: url,
                            darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                            slides: (settings.siteManagement?.slides ?? []).slice(),
                          },
                        };
                        setSettings(next);
                        void save(next);
                      });
                      e.currentTarget.value = '';
                    }}
                  />
                  {settings.siteManagement?.logoUrl && (
                    <p className="mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {settings.siteManagement.logoUrl}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
                  {settings.siteManagement?.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.siteManagement.logoUrl}
                      alt="Site logo önizleme"
                      className="h-16 w-auto"
                    />
                  ) : (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Logo seçilmedi.</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    Koyu zemin logosu
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file || !settings) return;
                      void uploadCoverFile(file, 'site', 'site:logo:dark').then((url) => {
                        if (!url) return;
                        const next: AdminSettings = {
                          ...settings,
                          siteManagement: {
                            ...(settings.siteManagement ?? { slides: [] }),
                            logoUrl: settings.siteManagement?.logoUrl ?? '',
                            darkLogoUrl: url,
                            slides: (settings.siteManagement?.slides ?? []).slice(),
                          },
                        };
                        setSettings(next);
                        void save(next);
                      });
                      e.currentTarget.value = '';
                    }}
                  />
                  {settings.siteManagement?.darkLogoUrl && (
                    <p className="mt-2 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {settings.siteManagement.darkLogoUrl}
                    </p>
                  )}
                </div>
                <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-900 p-3 dark:border-zinc-700">
                  {settings.siteManagement?.darkLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.siteManagement.darkLogoUrl}
                      alt="Koyu zemin logo önizleme"
                      className="h-16 w-auto"
                    />
                  ) : (
                    <p className="text-sm text-zinc-400">Koyu zemin logosu seçilmedi.</p>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">WhatsApp balonu</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Sağ alttaki yeşil butonun yönlendireceği numara. Örnek: <span className="font-mono">0553 688 27 34</span>,{' '}
                <span className="font-mono">905536882734</span> veya <span className="font-mono">+90 553 688 27 34</span>.
                Boş bırakırsanız varsayılan numara kullanılır.
              </p>
              <label className="mt-3 block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">WhatsApp telefon numarası</span>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="905536882734"
                  className="mt-1 min-h-11 w-full max-w-md rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={settings.siteManagement?.whatsappPhoneDigits ?? ''}
                  onChange={(e) => {
                    if (!settings) return;
                    const sm = settings.siteManagement ?? { slides: [] };
                    const next: AdminSettings = {
                      ...settings,
                      siteManagement: {
                        ...sm,
                        slides: (sm.slides ?? []).slice(),
                        logoUrl: sm.logoUrl ?? '',
                        darkLogoUrl: sm.darkLogoUrl ?? '',
                        whatsappPhoneDigits: e.target.value,
                      },
                    };
                    setSettings(next);
                  }}
                  onBlur={() => void save(settings)}
                />
              </label>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Slider</h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Her slide: görsel + başlık + alt başlık (+ opsiyonel rozet).
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  onClick={() => {
                    if (!settings) return;
                    const slides = (settings.siteManagement?.slides ?? []).slice();
                    slides.push({
                      id: crypto.randomUUID(),
                      imageUrl: '',
                      badge: '',
                      title: 'Yeni slide',
                      subtitle: '',
                    });
                    const next: AdminSettings = {
                      ...settings,
                      siteManagement: {
                        ...(settings.siteManagement ?? {}),
                        logoUrl: settings.siteManagement?.logoUrl ?? '',
                        darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                        slides,
                      },
                    };
                    setSettings(next);
                    void save(next);
                  }}
                >
                  Slide ekle
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {(settings.siteManagement?.slides ?? []).length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz slide yok.</p>
                )}

                {(settings.siteManagement?.slides ?? []).map((slide, idx) => (
                  <div
                    key={slide.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Slide {idx + 1}
                      </p>
                      <button
                        type="button"
                        className="min-h-10 rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                        onClick={() => {
                          if (!settings) return;
                          const slides = (settings.siteManagement?.slides ?? []).filter((s) => s.id !== slide.id);
                          const next: AdminSettings = {
                            ...settings,
                            siteManagement: {
                              ...(settings.siteManagement ?? {}),
                              logoUrl: settings.siteManagement?.logoUrl ?? '',
                              darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                              slides,
                            },
                          };
                          setSettings(next);
                          void save(next);
                        }}
                      >
                        Sil
                      </button>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Görsel</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file || !settings) return;
                              void uploadCoverFile(file, 'site', `site:slide:${slide.id}`).then((url) => {
                                if (!url) return;
                                const slides = (settings.siteManagement?.slides ?? []).map((s) =>
                                  s.id === slide.id ? { ...s, imageUrl: url } : s,
                                );
                                const next: AdminSettings = {
                                  ...settings,
                                  siteManagement: {
                                    ...(settings.siteManagement ?? {}),
                                    logoUrl: settings.siteManagement?.logoUrl ?? '',
                                    darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                                    slides,
                                  },
                                };
                                setSettings(next);
                                void save(next);
                              });
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>
                        {slide.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={slide.imageUrl}
                            alt="Slide görseli"
                            className="aspect-[16/9] w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                          />
                        ) : (
                          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                            Görsel seçilmedi
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Rozet (opsiyonel)</span>
                          <input
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            value={slide.badge ?? ''}
                            onChange={(e) => {
                              if (!settings) return;
                              const slides = (settings.siteManagement?.slides ?? []).map((s) =>
                                s.id === slide.id ? { ...s, badge: e.target.value } : s,
                              );
                              setSettings({
                                ...settings,
                                siteManagement: {
                                  ...(settings.siteManagement ?? {}),
                                  logoUrl: settings.siteManagement?.logoUrl ?? '',
                                  darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                                  slides,
                                },
                              });
                            }}
                            onBlur={() => {
                              if (!settings) return;
                              void save(settings);
                            }}
                            placeholder="Örn. Güvenli ödeme"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Başlık</span>
                          <input
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            value={slide.title}
                            onChange={(e) => {
                              if (!settings) return;
                              const slides = (settings.siteManagement?.slides ?? []).map((s) =>
                                s.id === slide.id ? { ...s, title: e.target.value } : s,
                              );
                              setSettings({
                                ...settings,
                                siteManagement: {
                                  ...(settings.siteManagement ?? {}),
                                  logoUrl: settings.siteManagement?.logoUrl ?? '',
                                  darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                                  slides,
                                },
                              });
                            }}
                            onBlur={() => {
                              if (!settings) return;
                              void save(settings);
                            }}
                            placeholder="Başlık"
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Alt başlık</span>
                          <textarea
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            value={slide.subtitle}
                            onChange={(e) => {
                              if (!settings) return;
                              const slides = (settings.siteManagement?.slides ?? []).map((s) =>
                                s.id === slide.id ? { ...s, subtitle: e.target.value } : s,
                              );
                              setSettings({
                                ...settings,
                                siteManagement: {
                                  ...(settings.siteManagement ?? {}),
                                  logoUrl: settings.siteManagement?.logoUrl ?? '',
                                  darkLogoUrl: settings.siteManagement?.darkLogoUrl ?? '',
                                  slides,
                                },
                              });
                            }}
                            onBlur={() => {
                              if (!settings) return;
                              void save(settings);
                            }}
                            placeholder="Alt başlık"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {uploadingKey && (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                  Yükleniyor… ({uploadingKey})
                </p>
              )}
            </section>
          </div>
        )}

        {tab === 'banner' && (
          <div className="space-y-8">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ana sayfada slider’ın hemen altında görünen banner alanlarını buradan yönetebilirsiniz.
            </p>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    Slider banner’lar
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Solda dönen küçük banner kartları (görsel + başlık + alt başlık + opsiyonel CTA).
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <label className="block text-sm lg:col-span-3">
                  <span className="text-zinc-600 dark:text-zinc-400">Görsel *</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void uploadCoverFile(file, 'banners', 'banner:new').then((url) => {
                        if (url) setBannerImageUrl(url);
                      });
                      e.currentTarget.value = '';
                    }}
                  />
                  <div className="mt-2 rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-700">
                    {bannerImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bannerImageUrl}
                        alt="Yeni banner görseli"
                        className="aspect-[16/9] w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                      />
                    ) : (
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">Görsel seçilmedi.</p>
                    )}
                  </div>
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Başlık *</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="Örn. Güvenli bilet al"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Alt başlık</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="Kısa açıklama"
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">CTA metni (opsiyonel)</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={bannerCtaText}
                    onChange={(e) => setBannerCtaText(e.target.value)}
                    placeholder="Örn. Detaylar"
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-end">
                <button
                  type="button"
                  disabled={saving}
                  className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  onClick={addSliderBanner}
                >
                  Slider banner ekle
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {(settings?.bannerManagement?.sliderBanners ?? []).length === 0 && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz banner yok.</p>
                )}

                {(settings?.bannerManagement?.sliderBanners ?? []).map((b, idx) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        Banner {idx + 1}
                      </p>
                      <button
                        type="button"
                        className="min-h-10 rounded border border-red-300 px-3 py-1.5 text-xs text-red-700 dark:border-red-800 dark:text-red-300"
                        onClick={() => removeSliderBanner(b.id)}
                      >
                        Sil
                      </button>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Görsel</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file || !settings) return;
                              void uploadCoverFile(file, 'banners', `banner:slide:${b.id}`).then((url) => {
                                if (!url) return;
                                const sliderBanners = (settings.bannerManagement?.sliderBanners ?? []).map((x) =>
                                  x.id === b.id ? { ...x, imageUrl: url } : x,
                                );
                                const next: AdminSettings = {
                                  ...settings,
                                  bannerManagement: {
                                    sliderBanners,
                                    rightBanner: settings.bannerManagement?.rightBanner,
                                  },
                                };
                                setSettings(next);
                                void save(next);
                              });
                              e.currentTarget.value = '';
                            }}
                          />
                        </label>

                        {b.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={b.imageUrl}
                            alt="Banner görseli"
                            className="aspect-[16/9] w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                          />
                        ) : (
                          <div className="flex aspect-[16/9] w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                            Görsel seçilmedi
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Başlık</span>
                          <input
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            value={b.title}
                            onChange={(e) => {
                              if (!settings) return;
                              const sliderBanners = (settings.bannerManagement?.sliderBanners ?? []).map((x) =>
                                x.id === b.id ? { ...x, title: e.target.value } : x,
                              );
                              setSettings({
                                ...settings,
                                bannerManagement: {
                                  sliderBanners,
                                  rightBanner: settings.bannerManagement?.rightBanner,
                                },
                              });
                            }}
                            onBlur={() => {
                              if (!settings) return;
                              void save(settings);
                            }}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">Alt başlık</span>
                          <textarea
                            rows={3}
                            className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            value={b.subtitle}
                            onChange={(e) => {
                              if (!settings) return;
                              const sliderBanners = (settings.bannerManagement?.sliderBanners ?? []).map((x) =>
                                x.id === b.id ? { ...x, subtitle: e.target.value } : x,
                              );
                              setSettings({
                                ...settings,
                                bannerManagement: {
                                  sliderBanners,
                                  rightBanner: settings.bannerManagement?.rightBanner,
                                },
                              });
                            }}
                            onBlur={() => {
                              if (!settings) return;
                              void save(settings);
                            }}
                          />
                        </label>
                        <label className="block text-sm">
                          <span className="text-zinc-600 dark:text-zinc-400">CTA metni</span>
                          <input
                            className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                            value={b.ctaText ?? ''}
                            onChange={(e) => {
                              if (!settings) return;
                              const sliderBanners = (settings.bannerManagement?.sliderBanners ?? []).map((x) =>
                                x.id === b.id ? { ...x, ctaText: e.target.value } : x,
                              );
                              setSettings({
                                ...settings,
                                bannerManagement: {
                                  sliderBanners,
                                  rightBanner: settings.bannerManagement?.rightBanner,
                                },
                              });
                            }}
                            onBlur={() => {
                              if (!settings) return;
                              void save(settings);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Sağ statik banner
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Örnekteki sağ tarafta duran sabit banner (görsel + metin + mağaza linkleri).
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Görsel</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file || !settings) return;
                        void uploadCoverFile(file, 'banners', 'banner:right').then((url) => {
                          if (!url) return;
                          const current = settings.bannerManagement?.rightBanner ?? {};
                          const nextRight = {
                            ...current,
                            imageUrl: url,
                          } satisfies NonNullable<AdminSettings['bannerManagement']>['rightBanner'];
                          updateRightBanner(nextRight);
                          const next: AdminSettings = {
                            ...settings,
                            bannerManagement: {
                              sliderBanners: (settings.bannerManagement?.sliderBanners ?? []).slice(),
                              rightBanner: nextRight,
                            },
                          };
                          setSettings(next);
                          void save(next);
                        });
                        e.currentTarget.value = '';
                      }}
                    />
                  </label>

                  {settings?.bannerManagement?.rightBanner?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.bannerManagement.rightBanner.imageUrl}
                      alt="Sağ banner görseli"
                      className="aspect-[4/3] w-full rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                    />
                  ) : (
                    <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                      Görsel seçilmedi
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Başlık</span>
                    <input
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                      value={rightTitle}
                      onChange={(e) => setRightTitle(e.target.value)}
                      onBlur={saveRightBanner}
                      placeholder="Örn. Uygulamayı hemen indir!"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Alt başlık</span>
                    <textarea
                      rows={3}
                      className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                      value={rightSubtitle}
                      onChange={(e) => setRightSubtitle(e.target.value)}
                      onBlur={saveRightBanner}
                      placeholder="Kısa açıklama"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">Google Play linki (opsiyonel)</span>
                    <input
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                      value={rightGooglePlayUrl}
                      onChange={(e) => setRightGooglePlayUrl(e.target.value)}
                      onBlur={saveRightBanner}
                      placeholder="https://play.google.com/..."
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400">App Store linki (opsiyonel)</span>
                    <input
                      className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                      value={rightAppStoreUrl}
                      onChange={(e) => setRightAppStoreUrl(e.target.value)}
                      onBlur={saveRightBanner}
                      placeholder="https://apps.apple.com/..."
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>
        )}

        {tab === 'payment' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ödeme yöntemlerini aktif/pasif yapın ve havale için banka bilgilerini girin.
            </p>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Ödeme seçenekleri</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.paymentManagement?.creditCardEnabled)}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: e.target.checked,
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                      void save(next);
                    }}
                  />
                  Kredi Kartı / İyzico aktif
                </label>
                <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.paymentManagement?.transferEnabled)}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: e.target.checked,
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                      void save(next);
                    }}
                  />
                  Havale aktif
                </label>
                <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.paymentManagement?.askSellEnabled)}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: e.target.checked,
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                      void save(next);
                    }}
                  />
                  Sor Sat aktif
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Havale banka bilgileri</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Banka adı</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={settings.paymentManagement?.transferBankName ?? ''}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: e.target.value,
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                    }}
                    onBlur={() => void save(settings)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Hesap sahibi</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={settings.paymentManagement?.transferAccountHolder ?? ''}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: e.target.value,
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                    }}
                    onBlur={() => void save(settings)}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="text-zinc-600 dark:text-zinc-400">IBAN</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={settings.paymentManagement?.transferIban ?? ''}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: e.target.value,
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                    }}
                    onBlur={() => void save(settings)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Şube</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={settings.paymentManagement?.transferBranch ?? ''}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: e.target.value,
                          transferDescription: settings.paymentManagement?.transferDescription ?? '',
                        },
                      };
                      setSettings(next);
                    }}
                    onBlur={() => void save(settings)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="text-zinc-600 dark:text-zinc-400">Açıklama notu</span>
                  <input
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={settings.paymentManagement?.transferDescription ?? ''}
                    onChange={(e) => {
                      const next: AdminSettings = {
                        ...settings,
                        paymentManagement: {
                          creditCardEnabled: Boolean(settings.paymentManagement?.creditCardEnabled),
                          transferEnabled: Boolean(settings.paymentManagement?.transferEnabled),
                          askSellEnabled: Boolean(settings.paymentManagement?.askSellEnabled),
                          transferBankName: settings.paymentManagement?.transferBankName ?? '',
                          transferAccountHolder: settings.paymentManagement?.transferAccountHolder ?? '',
                          transferIban: settings.paymentManagement?.transferIban ?? '',
                          transferBranch: settings.paymentManagement?.transferBranch ?? '',
                          transferDescription: e.target.value,
                        },
                      };
                      setSettings(next);
                    }}
                    onBlur={() => void save(settings)}
                  />
                </label>
              </div>
            </section>
          </div>
        )}

        {tab === 'mail' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Bilet ve fatura e-postaları aynı SMTP ayarlarını kullanır (
              <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-800">SMTP_*</code> ortam
              değişkenleri). Şifre buraya yazılmaz.
            </p>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Bilet e-postası</h2>
              <label className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(settings.mailManagement?.ticketEmailEnabled)}
                  onChange={(e) => {
                    const m = settings.mailManagement;
                    const next: AdminSettings = {
                      ...settings,
                      mailManagement: {
                        ticketEmailEnabled: e.target.checked,
                        ticketEmailSubject: m?.ticketEmailSubject ?? '',
                        ticketEmailBody: m?.ticketEmailBody ?? '',
                        invoiceEmailEnabled: Boolean(m?.invoiceEmailEnabled),
                        invoiceEmailSubject: m?.invoiceEmailSubject ?? '',
                        invoiceEmailBody: m?.invoiceEmailBody ?? '',
                      },
                    };
                    setSettings(next);
                    void save(next);
                  }}
                />
                Bilet hazır olunca müşteriye e-posta gönder
              </label>

              <label className="mt-4 block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">E-posta konusu</span>
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={settings.mailManagement?.ticketEmailSubject ?? ''}
                  onChange={(e) => {
                    const m = settings.mailManagement;
                    const next: AdminSettings = {
                      ...settings,
                      mailManagement: {
                        ticketEmailEnabled: Boolean(m?.ticketEmailEnabled),
                        ticketEmailSubject: e.target.value,
                        ticketEmailBody: m?.ticketEmailBody ?? '',
                        invoiceEmailEnabled: Boolean(m?.invoiceEmailEnabled),
                        invoiceEmailSubject: m?.invoiceEmailSubject ?? '',
                        invoiceEmailBody: m?.invoiceEmailBody ?? '',
                      },
                    };
                    setSettings(next);
                  }}
                  onBlur={() => void save(settings)}
                  placeholder="Örn. Rezervasyonunuz — {{siparisNo}}"
                />
              </label>

              <label className="mt-4 block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">E-posta metni (düz metin)</span>
                <textarea
                  rows={12}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={settings.mailManagement?.ticketEmailBody ?? ''}
                  onChange={(e) => {
                    const m = settings.mailManagement;
                    const next: AdminSettings = {
                      ...settings,
                      mailManagement: {
                        ticketEmailEnabled: Boolean(m?.ticketEmailEnabled),
                        ticketEmailSubject: m?.ticketEmailSubject ?? '',
                        ticketEmailBody: e.target.value,
                        invoiceEmailEnabled: Boolean(m?.invoiceEmailEnabled),
                        invoiceEmailSubject: m?.invoiceEmailSubject ?? '',
                        invoiceEmailBody: m?.invoiceEmailBody ?? '',
                      },
                    };
                    setSettings(next);
                  }}
                  onBlur={() => void save(settings)}
                  placeholder="Merhaba {{adSoyad}}, ..."
                />
              </label>

              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">Bilet — yer tutucular</p>
                <p className="mt-2 font-mono text-[11px] leading-relaxed">
                  {'{{adSoyad}}'} {'{{siparisNo}}'} {'{{turAdi}}'} {'{{tarih}}'} {'{{kalkis}}'} {'{{kisi}}'}{' '}
                  {'{{tutar}}'} {'{{dogrulamaUrl}}'} {'{{faturaUrl}}'} {'{{email}}'}
                </p>
                <p className="mt-2">PDF bilet e-postaya ek olarak eklenir.</p>
              </div>
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Fatura e-postası</h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Admin siparişe PDF fatura yüklediğinde otomatik gönderilir.
              </p>
              <label className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-200">
                <input
                  type="checkbox"
                  checked={Boolean(settings.mailManagement?.invoiceEmailEnabled)}
                  onChange={(e) => {
                    const m = settings.mailManagement;
                    const next: AdminSettings = {
                      ...settings,
                      mailManagement: {
                        ticketEmailEnabled: Boolean(m?.ticketEmailEnabled),
                        ticketEmailSubject: m?.ticketEmailSubject ?? '',
                        ticketEmailBody: m?.ticketEmailBody ?? '',
                        invoiceEmailEnabled: e.target.checked,
                        invoiceEmailSubject: m?.invoiceEmailSubject ?? '',
                        invoiceEmailBody: m?.invoiceEmailBody ?? '',
                      },
                    };
                    setSettings(next);
                    void save(next);
                  }}
                />
                Fatura yüklendiğinde müşteriye e-posta gönder
              </label>

              <label className="mt-4 block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">E-posta konusu</span>
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={settings.mailManagement?.invoiceEmailSubject ?? ''}
                  onChange={(e) => {
                    const m = settings.mailManagement;
                    const next: AdminSettings = {
                      ...settings,
                      mailManagement: {
                        ticketEmailEnabled: Boolean(m?.ticketEmailEnabled),
                        ticketEmailSubject: m?.ticketEmailSubject ?? '',
                        ticketEmailBody: m?.ticketEmailBody ?? '',
                        invoiceEmailEnabled: Boolean(m?.invoiceEmailEnabled),
                        invoiceEmailSubject: e.target.value,
                        invoiceEmailBody: m?.invoiceEmailBody ?? '',
                      },
                    };
                    setSettings(next);
                  }}
                  onBlur={() => void save(settings)}
                  placeholder="Örn. Faturanız — {{siparisNo}}"
                />
              </label>

              <label className="mt-4 block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">E-posta metni (düz metin)</span>
                <textarea
                  rows={10}
                  className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={settings.mailManagement?.invoiceEmailBody ?? ''}
                  onChange={(e) => {
                    const m = settings.mailManagement;
                    const next: AdminSettings = {
                      ...settings,
                      mailManagement: {
                        ticketEmailEnabled: Boolean(m?.ticketEmailEnabled),
                        ticketEmailSubject: m?.ticketEmailSubject ?? '',
                        ticketEmailBody: m?.ticketEmailBody ?? '',
                        invoiceEmailEnabled: Boolean(m?.invoiceEmailEnabled),
                        invoiceEmailSubject: m?.invoiceEmailSubject ?? '',
                        invoiceEmailBody: e.target.value,
                      },
                    };
                    setSettings(next);
                  }}
                  onBlur={() => void save(settings)}
                  placeholder="Merhaba {{adSoyad}}, ..."
                />
              </label>

              <div className="mt-4 rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                <p className="font-medium text-zinc-800 dark:text-zinc-200">Fatura — yer tutucular</p>
                <p className="mt-2 font-mono text-[11px] leading-relaxed">
                  {'{{adSoyad}}'} {'{{siparisNo}}'} {'{{turAdi}}'} {'{{tarih}}'} {'{{kalkis}}'} {'{{kisi}}'}{' '}
                  {'{{tutar}}'} {'{{dogrulamaUrl}}'} {'{{faturaUrl}}'} {'{{email}}'}
                </p>
                <p className="mt-2">
                  <code className="text-[11px]">{'{{faturaUrl}}'}</code> yüklenen PDF faturanın tam bağlantısıdır.
                  Ek dosya adı yüklediğiniz dosya adına göre temizlenir.
                </p>
              </div>
            </section>
          </div>
        )}

        {tab === 'social' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Footer’da gösterilecek sosyal bağlantılar. Tam URL girin (örn.{' '}
              <span className="font-mono text-xs">https://instagram.com/...</span>).
            </p>
            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              {(
                [
                  ['instagramUrl', 'Instagram'],
                  ['facebookUrl', 'Facebook'],
                  ['googleUrl', 'Google'],
                  ['youtubeUrl', 'Youtube'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="mb-4 block text-sm last:mb-0">
                  <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
                  <input
                    type="url"
                    className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                    value={(settings.socialMedia?.[key] as string | undefined) ?? ''}
                    onChange={(e) => {
                      if (!settings) return;
                      const sm = settings.socialMedia ?? {};
                      const next: AdminSettings = {
                        ...settings,
                        socialMedia: { ...sm, [key]: e.target.value },
                      };
                      setSettings(next);
                    }}
                    onBlur={() => void save(settings)}
                    placeholder="https://"
                  />
                </label>
              ))}
            </section>
          </div>
        )}

        {tab === 'blok' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Ana sayfa / kategori sayfalarında kullanılacak blok görsellerini buradan yönetebilirsiniz.
            </p>

            <div className="-mx-1 flex gap-1 overflow-x-auto pb-1 sm:mx-0" role="tablist" aria-label="Blok sekmeleri">
              <button
                type="button"
                role="tab"
                aria-selected={blockTab === 'kategoriBanner'}
                onClick={() => setBlockTab('kategoriBanner')}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition min-h-11 ${
                  blockTab === 'kategoriBanner'
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border border-zinc-300 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
                }`}
              >
                Kategori Banner Yönetimi
              </button>
            </div>

            {blockTab === 'kategoriBanner' && (
              <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">Villa bölgeleri</p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Villalarda tanımlı <span className="font-mono">Bölge</span> alanları listelenir. Her bölge için banner
                      görseli yükleyebilirsiniz.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={regionsLoading}
                    onClick={() => {
                      setRegionsReloadTick((x) => x + 1);
                    }}
                    className="min-h-11 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    {regionsLoading ? 'Yükleniyor…' : 'Yenile'}
                  </button>
                </div>

                {regionsLoading ? (
                  <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Bölgeler yükleniyor…</p>
                ) : villaRegions.length === 0 ? (
                  <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">Bölge bulunamadı.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {villaRegions.map((region) => {
                      const banners = settings.blockManagement?.villaRegionBanners ?? {};
                      const currentUrl = banners[region] ?? '';
                      const uploadKey = `block:region:${region}`;
                      return (
                        <li
                          key={region}
                          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{region}</p>
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Öneri: yatay banner (örn. 1400×400).
                              </p>
                              {currentUrl ? (
                                <p className="mt-2 truncate font-mono text-[11px] text-zinc-500">{currentUrl}</p>
                              ) : (
                                <p className="mt-2 text-xs text-zinc-500">Henüz banner yok.</p>
                              )}
                            </div>

                            <div className="shrink-0">
                              <input
                                type="file"
                                accept="image/*"
                                className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 sm:w-[320px]"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !settings) return;
                                  void uploadCoverFile(file, 'blocks', uploadKey).then((url) => {
                                    if (!url) return;
                                    const prev = settings.blockManagement?.villaRegionBanners ?? {};
                                    const next: AdminSettings = {
                                      ...settings,
                                      blockManagement: {
                                        ...(settings.blockManagement ?? {}),
                                        villaRegionBanners: { ...prev, [region]: url },
                                      },
                                    };
                                    setSettings(next);
                                    void save(next);
                                  });
                                  e.currentTarget.value = '';
                                }}
                              />
                              {uploadingKey === uploadKey && (
                                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>
                              )}
                            </div>
                          </div>

                          {currentUrl ? (
                            <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/60">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={currentUrl} alt={`${region} banner`} className="h-28 w-full object-cover" />
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        )}

        {tab === 'footer' && (
          <div className="space-y-6">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              TÜRSAB dijital doğrulama bandı, ödeme görselleri ve alt çubuk metni. TÜRSAB görseli tıklanınca{' '}
              <span className="font-mono text-xs">https://www.tursab.org.tr/tr/ddsv</span> adresine gider.
            </p>
            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">TÜRSAB dijital doğrulama bandı</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                İzin belgeleri alanı — PNG veya SVG. Yükleme sonrası kaydedilir; sitede sabit bağlantıyla gösterilir.
              </p>
              <input
                type="file"
                accept="image/*"
                className="mt-2 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file || !settings) return;
                  void uploadCoverFile(file, 'footer', 'footer:tursab-dds').then((url) => {
                    if (!url) return;
                    const fm = settings.footerManagement ?? {};
                    const next: AdminSettings = {
                      ...settings,
                      footerManagement: { ...fm, tursabVerificationImageUrl: url },
                    };
                    setSettings(next);
                    void save(next);
                  });
                  e.currentTarget.value = '';
                }}
              />
              {settings.footerManagement?.tursabVerificationImageUrl ? (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.footerManagement.tursabVerificationImageUrl}
                    alt="TÜRSAB önizleme"
                    className="max-h-24 w-auto max-w-full object-contain object-left"
                  />
                  <p className="mt-1 truncate text-xs text-zinc-500">{settings.footerManagement.tursabVerificationImageUrl}</p>
                  <button
                    type="button"
                    className="mt-2 text-sm font-medium text-red-600 hover:underline dark:text-red-400"
                    onClick={() => {
                      if (!settings) return;
                      const fm = settings.footerManagement ?? {};
                      const next: AdminSettings = {
                        ...settings,
                        footerManagement: { ...fm, tursabVerificationImageUrl: '' },
                      };
                      setSettings(next);
                      void save(next);
                    }}
                  >
                    Görseli kaldır
                  </button>
                </div>
              ) : (
                <p className="mt-2 text-xs text-zinc-500">Henüz görsel yok.</p>
              )}
            </section>

            <section className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700">
              <label className="block text-sm">
                <span className="text-zinc-600 dark:text-zinc-400">Alt çubuk sağ metin</span>
                <input
                  className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  value={settings.footerManagement?.footerBrandText ?? ''}
                  onChange={(e) => {
                    if (!settings) return;
                    const fm = settings.footerManagement ?? {};
                    const next: AdminSettings = {
                      ...settings,
                      footerManagement: { ...fm, footerBrandText: e.target.value },
                    };
                    setSettings(next);
                  }}
                  onBlur={() => void save(settings)}
                  placeholder="12.adalartekneturu.com"
                />
              </label>

              <div className="mt-6">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Ödeme yöntemleri görseli</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  PNG veya SVG önerilir. Yükleme sonrası kaydedilir.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !settings) return;
                    void uploadCoverFile(file, 'footer', 'footer:payment').then((url) => {
                      if (!url) return;
                      const fm = settings.footerManagement ?? {};
                      const next: AdminSettings = {
                        ...settings,
                        footerManagement: { ...fm, paymentMethodsImageUrl: url },
                      };
                      setSettings(next);
                      void save(next);
                    });
                    e.currentTarget.value = '';
                  }}
                />
                {settings.footerManagement?.paymentMethodsImageUrl ? (
                  <div className="mt-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={settings.footerManagement.paymentMethodsImageUrl}
                      alt="Önizleme"
                      className="max-h-14 w-auto max-w-full object-contain object-left"
                    />
                    <p className="mt-1 truncate text-xs text-zinc-500">{settings.footerManagement.paymentMethodsImageUrl}</p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-zinc-500">Henüz görsel yok.</p>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
