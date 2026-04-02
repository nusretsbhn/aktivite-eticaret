'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type { AdminSettings } from '@/types/admin-settings';

type ContractKey = keyof NonNullable<AdminSettings['contracts']>;

const CONTRACT_FIELDS: { key: ContractKey; label: string }[] = [
  { key: 'kvkkPolicy', label: '1) Kişisel Verilerin Korunması Politikası' },
  { key: 'termsOfUse', label: '2) Kullanım Koşulları' },
  { key: 'cookiePolicy', label: '3) Çerez Politikası' },
  { key: 'onlineVisitorsClarification', label: '4) Çevrimiçi Ziyaretçiler İçin Aydınlatma Metni' },
  { key: 'commercialElectronicConsent', label: '5) Ticari Elektronik İleti Onayı' },
  { key: 'preInformationForm', label: '6) Ön Bilgilendirme Formu' },
  { key: 'distanceSalesContract', label: '7) Mesafeli Satış Sözleşmesi' },
  { key: 'transactionGuide', label: '8) İşlem Rehberi' },
  { key: 'privacyAgreement', label: '9) Gizlilik Sözleşmesi' },
  { key: 'explicitConsentText', label: '10) Açık Rıza Metni' },
  { key: 'deliveryAndReturnTerms', label: '11) Teslimat ve İade Şartları' },
];

function getEmptyContracts(): NonNullable<AdminSettings['contracts']> {
  return {
    kvkkPolicy: '',
    termsOfUse: '',
    cookiePolicy: '',
    onlineVisitorsClarification: '',
    commercialElectronicConsent: '',
    preInformationForm: '',
    distanceSalesContract: '',
    transactionGuide: '',
    privacyAgreement: '',
    explicitConsentText: '',
    deliveryAndReturnTerms: '',
  };
}

export function ContractsPageClient() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const contracts = useMemo(
    () => settings?.contracts ?? getEmptyContracts(),
    [settings?.contracts],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) {
      setError('Sözleşme verileri yüklenemedi');
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

  function updateContractField(key: ContractKey, value: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      contracts: {
        ...contracts,
        [key]: value,
      },
    });
  }

  function saveFieldOnBlur(key: ContractKey, value: string) {
    if (!settings) return;
    const next: AdminSettings = {
      ...settings,
      contracts: {
        ...contracts,
        [key]: value.trim(),
      },
    };
    setSettings(next);
    void save(next);
  }

  if (loading || !settings) {
    return <p className="text-zinc-500 dark:text-zinc-400">{error ?? 'Yükleniyor…'}</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Sözleşme Yönetimi
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Üyelik ve satış süreçlerinde kullanılacak tüm sözleşme metinlerini buradan güncelleyebilirsiniz.
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

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="space-y-5">
          {CONTRACT_FIELDS.map((field) => (
            <label key={field.key} className="block text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{field.label}</span>
              <textarea
                rows={6}
                className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50"
                value={contracts[field.key]}
                onChange={(e) => updateContractField(field.key, e.target.value)}
                onBlur={(e) => saveFieldOnBlur(field.key, e.target.value)}
                placeholder="Sözleşme metnini girin..."
              />
            </label>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save(settings)}
            className="min-h-11 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-70 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? 'Kaydediliyor…' : 'Tümünü kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
}

