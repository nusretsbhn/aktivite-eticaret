'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useSiteAuth } from '@/components/site/site-auth-provider';
import { SiteNotificationBell } from '@/components/site/site-notification-bell';
import { SiteFooter } from '@/components/site/site-footer';
import type { SiteProductType } from '@/lib/site-product-types';
import type { AdminSettings } from '@/types/admin-settings';

export function HesapProfileClient({
  logoUrl,
  socialMedia,
  footerManagement,
  enabledSiteProducts,
}: {
  logoUrl?: string;
  socialMedia?: AdminSettings['socialMedia'];
  footerManagement?: AdminSettings['footerManagement'];
  enabledSiteProducts?: SiteProductType[];
}) {
  const router = useRouter();
  const { user, authReady, refreshUser } = useSiteAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [newPw2, setNewPw2] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  useEffect(() => {
    if (authReady && !user) {
      router.replace('/');
    }
  }, [authReady, user, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhone(user.phone);
      setEmail(user.email);
    }
  }, [user]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    try {
      const res = await fetch('/api/public/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phone }),
      });
      const data = (await res.json()) as { error?: string; user?: { fullName: string; phone: string } };
      if (!res.ok) {
        setProfileMsg(data.error ?? 'Kaydedilemedi.');
        return;
      }
      if (data.user) {
        setFullName(data.user.fullName);
        setPhone(data.user.phone);
      }
      await refreshUser();
      setProfileMsg('Bilgiler güncellendi.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== newPw2) {
      setPwMsg('Yeni şifreler eşleşmiyor.');
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetch('/api/public/auth/password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setPwMsg(data.error ?? 'Şifre değiştirilemedi.');
        return;
      }
      setCurrentPw('');
      setNewPw('');
      setNewPw2('');
      setPwMsg('Şifreniz güncellendi.');
    } finally {
      setPwLoading(false);
    }
  }

  if (!authReady || !user) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center text-zinc-600">Yükleniyor…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/hesap/siparisler" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              Siparişlerim
            </Link>
            <SiteNotificationBell />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-extrabold text-zinc-900">Hesap Bilgileri</h1>
        <p className="mt-1 text-sm text-zinc-600">Üyelik sırasında paylaştığınız bilgileri güncelleyebilirsiniz.</p>

        <form onSubmit={saveProfile} className="mt-8 space-y-4 rounded-2xl border border-zinc-200 bg-white p-6">
          <label className="block text-sm">
            <span className="font-semibold text-zinc-800">Ad Soyad</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-zinc-800">Telefon</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
              required
            />
          </label>
          <label className="block text-sm">
            <span className="font-semibold text-zinc-800">E-posta</span>
            <input value={email} readOnly className="mt-1 min-h-11 w-full cursor-not-allowed rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-600" />
          </label>
          {profileMsg && (
            <p className={`text-sm font-medium ${profileMsg.includes('güncellendi') ? 'text-emerald-600' : 'text-red-600'}`}>
              {profileMsg}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
          >
            {saving ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </form>

        <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-6">
          <h2 className="text-lg font-bold text-zinc-900">Şifremi Sıfırla</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Mevcut şifrenizi girerek yeni bir şifre belirleyin. Şifre en az 8 karakter; büyük/küçük harf, rakam ve özel karakter içermelidir.
          </p>
          <form onSubmit={changePassword} className="mt-4 space-y-3">
            <label className="block text-sm">
              <span className="text-zinc-700">Mevcut şifre</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-700">Yeni şifre</span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-700">Yeni şifre (tekrar)</span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPw2}
                onChange={(e) => setNewPw2(e.target.value)}
                className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 px-3 py-2"
                required
              />
            </label>
            {pwMsg && (
              <p className={`text-sm font-medium ${pwMsg.includes('güncellendi') ? 'text-emerald-600' : 'text-red-600'}`}>
                {pwMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="rounded-xl border border-zinc-300 bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-100 disabled:opacity-60"
            >
              {pwLoading ? 'İşleniyor…' : 'Şifreyi güncelle'}
            </button>
          </form>
        </section>
      </main>

      <SiteFooter
        socialMedia={socialMedia}
        footerManagement={footerManagement}
        enabledSiteProducts={enabledSiteProducts}
      />
    </div>
  );
}
