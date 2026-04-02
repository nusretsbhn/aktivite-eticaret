'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

function getPasswordPolicyError(password: string): string | null {
  if (password.length < 8) return 'En az 8 karakter olmalı.';
  if (!/[A-Z]/.test(password)) return 'En az 1 büyük harf içermeli.';
  if (!/[a-z]/.test(password)) return 'En az 1 küçük harf içermeli.';
  if (!/[0-9]/.test(password)) return 'En az 1 rakam içermeli.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'En az 1 özel karakter içermeli.';
  return null;
}

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void }) => number;
      reset: (id?: number) => void;
      ready: (cb: () => void) => void;
    };
  }
}

/** Dark mode body’den gelen açık renk devralımını keser; input içi her zaman koyu metin */
const inputClassName =
  'mt-1 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-500 shadow-none outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

const selectClassName =
  'h-11 shrink-0 rounded-xl border border-zinc-300 bg-white px-2 text-sm text-zinc-900 shadow-none outline-none transition focus:border-teal-500 focus:ring-1 focus:ring-teal-500';

export function RegisterFormClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const villa = (sp.get('villa') ?? '').trim();
  const checkIn = (sp.get('checkIn') ?? '').trim();
  const checkOut = (sp.get('checkOut') ?? '').trim();
  const guests = sp.get('guests') ?? '1';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('+90');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [kvkk, setKvkk] = useState(false);
  const [sms, setSms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaWidgetId = useRef<number | null>(null);
  const [recaptchaToken, setRecaptchaToken] = useState('');

  useEffect(() => {
    if (!recaptchaSiteKey) {
      return;
    }
    const el = recaptchaRef.current;
    if (!el) return;

    const renderBox = () => {
      if (!window.grecaptcha || !recaptchaRef.current || recaptchaWidgetId.current !== null) return;
      window.grecaptcha.ready(() => {
        if (!recaptchaRef.current || recaptchaWidgetId.current !== null) return;
        recaptchaWidgetId.current = window.grecaptcha!.render(recaptchaRef.current, {
          sitekey: recaptchaSiteKey,
          callback: (token: string) => setRecaptchaToken(token),
        });
      });
    };

    if (window.grecaptcha) {
      renderBox();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.onload = renderBox;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [recaptchaSiteKey]);

  const submit = useCallback(async () => {
    setErr(null);
    const pe = getPasswordPolicyError(password);
    if (pe) {
      setErr(pe);
      return;
    }
    if (password !== passwordAgain) {
      setErr('Şifreler eşleşmiyor.');
      return;
    }
    if (!kvkk || !sms) {
      setErr('Tüm sözleşme onaylarını işaretleyin.');
      return;
    }
    const token = recaptchaSiteKey ? recaptchaToken : 'dev-pass';
    if (recaptchaSiteKey && !token) {
      setErr('Lütfen robot olmadığınızı doğrulayın.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/public/auth/register-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          phoneCountryCode: phoneCountry,
          password,
          passwordConfirm: passwordAgain,
          kvkkConsent: kvkk,
          smsConsent: sms,
          recaptchaToken: token,
          villa: villa || undefined,
          checkIn: villa ? checkIn : undefined,
          checkOut: villa ? checkOut : undefined,
          guests: villa ? guests : undefined,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string; expiresAt?: string };
      if (!res.ok || !data.success) {
        setErr(data.message ?? 'İşlem başarısız.');
        return;
      }
      if (typeof window !== 'undefined' && data.expiresAt) {
        sessionStorage.setItem(
          'registerOtpMeta',
          JSON.stringify({ email: email.trim().toLowerCase(), expiresAt: data.expiresAt }),
        );
      }
      router.push(`/kayit/dogrula?email=${encodeURIComponent(email.trim().toLowerCase())}`);
    } finally {
      setLoading(false);
    }
  }, [
    checkIn,
    checkOut,
    email,
    firstName,
    guests,
    kvkk,
    lastName,
    password,
    passwordAgain,
    phone,
    phoneCountry,
    recaptchaSiteKey,
    recaptchaToken,
    router,
    sms,
    villa,
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:max-w-xl lg:px-12">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 text-zinc-900 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-zinc-900">Hesap Oluşturun</h1>
          <p className="mt-2 text-sm text-zinc-500">Aşağıdaki bilgileri doldurarak hesabınızı oluşturun.</p>

          {err && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-zinc-600">Ad</span>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                className={inputClassName}
              />
            </label>
            <label className="block text-sm">
              <span className="text-zinc-600">Soyad</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                className={inputClassName}
              />
            </label>
          </div>

          <label className="mt-4 block text-sm">
            <span className="text-zinc-600">E-posta</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClassName}
            />
          </label>

          <div className="mt-4">
            <span className="text-sm text-zinc-600">Telefon</span>
            <div className="mt-1 flex gap-2">
              <select
                value={phoneCountry}
                onChange={(e) => setPhoneCountry(e.target.value)}
                className={selectClassName}
              >
                <option value="+90">+90</option>
                <option value="+44">+44</option>
                <option value="+49">+49</option>
              </select>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                placeholder="5xx xxx xx xx"
                autoComplete="tel-national"
                className="h-11 min-w-0 flex-1 rounded-xl border border-teal-400 bg-white px-3 text-base text-zinc-900 placeholder:text-zinc-500 shadow-none outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <label className="mt-4 block text-sm">
            <span className="text-zinc-600">Şifre</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className={inputClassName}
            />
          </label>
          <label className="mt-4 block text-sm">
            <span className="text-zinc-600">Şifre tekrar</span>
            <input
              type="password"
              value={passwordAgain}
              onChange={(e) => setPasswordAgain(e.target.value)}
              autoComplete="new-password"
              className={inputClassName}
            />
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
            <input type="checkbox" checked={kvkk} onChange={(e) => setKvkk(e.target.checked)} className="mt-1" />
            <span>
              <Link href="/sozlesmeler/mesafeli-satis" className="font-semibold text-teal-700 hover:underline">
                Site Kullanım Sözleşmesi
              </Link>
              &apos;ni ve{' '}
              <Link href="/sozlesmeler/gizlilik" className="font-semibold text-teal-700 hover:underline">
                Gizlilik Sözleşmesi
              </Link>
              &apos;ni okudum, kabul ediyorum.
            </span>
          </label>

          <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-zinc-700">
            <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} className="mt-1" />
            <span>
              <span className="font-semibold text-teal-700">Kişisel Verilerin Korunması</span> ve{' '}
              <span className="font-semibold text-teal-700">Aydınlatma Metni</span>
              &apos;ni okudum; KVKK kapsamında açık rıza veriyorum.
            </span>
          </label>

          {recaptchaSiteKey ? (
            <div className="mt-5 flex justify-center">
              <div ref={recaptchaRef} />
            </div>
          ) : (
            <p className="mt-4 text-xs text-amber-700">Geliştirme: reCAPTCHA kapalı (SMTP ile e-posta gerekir).</p>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={() => void submit()}
            className="mt-6 w-full rounded-full bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
          >
            {loading ? 'Gönderiliyor…' : 'Devam Et'}
          </button>

          <p className="mt-6 text-center text-sm text-zinc-600">
            Hesabınız var mı?{' '}
            <Link href="/" className="font-semibold text-teal-700 hover:underline">
              Giriş yapın
            </Link>
          </p>
        </div>
      </div>

      <div
        className="relative hidden min-h-[50vh] flex-1 lg:flex lg:min-h-screen"
        style={{
          backgroundImage:
            'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.45)), url(https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="relative z-10 m-auto max-w-md px-8 text-center text-white">
          <p className="text-lg font-medium leading-relaxed drop-shadow-md">
            Bodrum Aktivite güvencesiyle seçilmiş villalarda unutulmaz konaklama deneyimleri
          </p>
        </div>
      </div>
    </div>
  );
}
