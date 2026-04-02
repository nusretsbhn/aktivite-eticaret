'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function VerifyClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const emailParam = (sp.get('email') ?? '').trim().toLowerCase();

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!emailParam) return;
    try {
      const raw = sessionStorage.getItem('registerOtpMeta');
      if (raw) {
        const { email, expiresAt: ex } = JSON.parse(raw) as { email?: string; expiresAt?: string };
        if (email === emailParam && ex) {
          setExpiresAt(new Date(ex).getTime());
        }
      }
    } catch {
      /* ignore */
    }
  }, [emailParam]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remainingSec =
    expiresAt != null ? Math.max(0, Math.floor((expiresAt - now) / 1000)) : 15 * 60;
  const mm = String(Math.floor(remainingSec / 60)).padStart(2, '0');
  const ss = String(remainingSec % 60).padStart(2, '0');

  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (d && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
  };

  const paste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (t.length === 6) {
      setDigits(t.split(''));
      inputsRef.current[5]?.focus();
      e.preventDefault();
    }
  };

  const verify = useCallback(async () => {
    const code = digits.join('');
    if (code.length !== 6) {
      setErr('6 haneli kodu girin.');
      return;
    }
    if (!emailParam) {
      setErr('E-posta bulunamadı. Kayıt sayfasına dönün.');
      return;
    }
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch('/api/public/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam, code }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        redirect?: string;
      };
      if (!res.ok || !data.success) {
        setErr(data.message ?? 'Doğrulama başarısız.');
        return;
      }
      sessionStorage.removeItem('registerOtpMeta');
      router.replace(data.redirect ?? '/hesap');
    } finally {
      setLoading(false);
    }
  }, [digits, emailParam, router]);

  const resend = async () => {
    if (!emailParam || remainingSec > 0) return;
    setResendLoading(true);
    setErr(null);
    try {
      const res = await fetch('/api/public/auth/register-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailParam }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string; expiresAt?: string };
      if (!res.ok || !data.success) {
        setErr(data.message ?? 'Yeniden gönderilemedi.');
        return;
      }
      if (data.expiresAt) {
        setExpiresAt(new Date(data.expiresAt).getTime());
        sessionStorage.setItem(
          'registerOtpMeta',
          JSON.stringify({ email: emailParam, expiresAt: data.expiresAt }),
        );
      }
    } finally {
      setResendLoading(false);
    }
  };

  if (!emailParam) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
        <p className="text-zinc-600">
          Geçersiz bağlantı.{' '}
          <Link href="/kayit" className="font-semibold text-teal-700">
            Kayıt sayfasına dön
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 lg:flex-row">
      <div className="flex flex-1 flex-col justify-center px-4 py-10 sm:px-8 lg:w-1/2 lg:max-w-xl lg:px-12">
        <div className="mx-auto w-full max-w-md rounded-2xl bg-white p-6 text-zinc-900 shadow-sm sm:p-8">
          <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">Doğrulama kodunu girin</h1>
          <p className="mt-2 text-sm text-zinc-600">
            <span className="font-semibold text-zinc-900">{emailParam}</span> adresine gönderilen 6 haneli kodu girin
          </p>

          {err && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
          )}

          <div className="mt-6 flex justify-center gap-2" onPaste={paste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputsRef.current[i] = el;
                }}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKeyDown(i, e)}
                inputMode="numeric"
                maxLength={1}
                className="h-12 w-11 rounded-lg border-2 border-zinc-200 bg-white text-center text-lg font-semibold text-zinc-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-medium tabular-nums">
                ⏱ {mm}:{ss}
              </span>
              <button
                type="button"
                disabled={remainingSec > 0 || resendLoading}
                onClick={() => void resend()}
                className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4" />
                Yeniden kod gönder
              </button>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-teal-800/90">
              E-posta gelmediyse spam klasörünü kontrol edin. Süre dolunca yeniden kod isteyebilirsiniz.
            </p>
          </div>

          <button
            type="button"
            disabled={loading || digits.join('').length !== 6}
            onClick={() => void verify()}
            className="mt-6 w-full rounded-full bg-teal-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
          >
            {loading ? 'Doğrulanıyor…' : 'Kodu doğrula'}
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
