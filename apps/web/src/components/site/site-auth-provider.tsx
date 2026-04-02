'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

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
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void }) => number;
      reset: (id?: number) => void;
      ready: (cb: () => void) => void;
    };
  }
}

export type PublicUserBrief = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
};

type SiteAuthContextValue = {
  user: PublicUserBrief | null;
  authReady: boolean;
  /** İsteğe bağlı: açılışta giriş veya kayıt sekmesi */
  openAuth: (mode?: 'login' | 'register') => void;
  closeAuth: () => void;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
};

const SiteAuthContext = createContext<SiteAuthContextValue | null>(null);

export function useSiteAuth(): SiteAuthContextValue {
  const ctx = useContext(SiteAuthContext);
  if (!ctx) {
    throw new Error('useSiteAuth must be used within SiteAuthProvider');
  }
  return ctx;
}

export function SiteAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUserBrief | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [kvkkConsent, setKvkkConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const [recaptchaChecked, setRecaptchaChecked] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authOk, setAuthOk] = useState<string | null>(null);
  const recaptchaBoxRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetIdRef = useRef<number | null>(null);
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

  const openAuth = useCallback((mode?: 'login' | 'register') => {
    if (mode) setAuthMode(mode);
    setLoginOpen(true);
  }, []);
  const closeAuth = useCallback(() => setLoginOpen(false), []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/public/auth/me', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { user?: PublicUserBrief | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/public/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshUser();
      setAuthReady(true);
    })();
  }, [refreshUser]);

  const value = useMemo(
    () => ({ user, authReady, openAuth, closeAuth, refreshUser, logout }),
    [user, authReady, openAuth, closeAuth, refreshUser, logout],
  );

  useEffect(() => {
    if (!loginOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLoginOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [loginOpen]);

  useEffect(() => {
    if (!loginOpen || authMode !== 'register' || !recaptchaSiteKey) return;
    if (window.grecaptcha && recaptchaBoxRef.current && recaptchaWidgetIdRef.current === null) {
      window.grecaptcha.ready(() => {
        if (!recaptchaBoxRef.current || recaptchaWidgetIdRef.current !== null) return;
        recaptchaWidgetIdRef.current = window.grecaptcha?.render(recaptchaBoxRef.current, {
          sitekey: recaptchaSiteKey,
          callback: (token: string) => setRecaptchaToken(token),
        }) ?? null;
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.grecaptcha || !recaptchaBoxRef.current || recaptchaWidgetIdRef.current !== null) return;
      recaptchaWidgetIdRef.current = window.grecaptcha.render(recaptchaBoxRef.current, {
        sitekey: recaptchaSiteKey,
        callback: (token: string) => setRecaptchaToken(token),
      });
    };
    document.body.appendChild(script);
  }, [authMode, loginOpen, recaptchaSiteKey]);

  async function submitLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setAuthOk(null);
    setAuthLoading(true);
    try {
      const res = await fetch('/api/public/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        user?: PublicUserBrief;
      };
      if (!res.ok || !data.success) {
        setAuthError(data.message ?? 'Giriş başarısız.');
        return;
      }
      if (data.user) {
        setUser(data.user);
      } else {
        await refreshUser();
      }
      setAuthOk('Giriş başarılı.');
      setTimeout(() => setLoginOpen(false), 700);
    } finally {
      setAuthLoading(false);
    }
  }

  async function submitRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    setAuthOk(null);

    const policyError = getPasswordPolicyError(password);
    if (policyError) {
      setAuthError(`Şifre politikası: ${policyError}`);
      return;
    }
    if (password !== passwordAgain) {
      setAuthError('Şifreler eşleşmiyor.');
      return;
    }
    if (!kvkkConsent || !smsConsent) {
      setAuthError('KVKK ve SMS izin onayları zorunludur.');
      return;
    }

    const token = recaptchaSiteKey ? recaptchaToken : recaptchaChecked ? 'dev-pass' : '';
    if (!token) {
      setAuthError('Lütfen reCAPTCHA doğrulamasını tamamlayın.');
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch('/api/public/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          password,
          passwordConfirm: passwordAgain,
          kvkkConsent,
          smsConsent,
          recaptchaToken: token,
        }),
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setAuthError(data.message ?? 'Kayıt başarısız.');
        return;
      }
      setAuthOk('Kayıt başarılı. Şimdi giriş yapabilirsiniz.');
      setAuthMode('login');
      setPassword('');
      setPasswordAgain('');
      if (window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
        window.grecaptcha.reset(recaptchaWidgetIdRef.current);
      }
      setRecaptchaToken('');
      setRecaptchaChecked(false);
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <SiteAuthContext.Provider value={value}>
      {children}

      {loginOpen && (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/55"
            onClick={() => setLoginOpen(false)}
          />

          <div className="relative z-[71] mx-auto mt-16 w-[92%] max-w-md rounded-2xl bg-white p-6 text-zinc-900 shadow-2xl md:mt-20">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-extrabold">
                  {authMode === 'login' ? 'Hesabınızla Oturum Açın' : 'Yeni Hesap Oluşturun'}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {authMode === 'login'
                    ? 'E-posta ve şifreniz ile giriş yapın.'
                    : 'Bilgilerinizi doldurarak üyeliğinizi oluşturun.'}
                </p>
              </div>
              <button
                type="button"
                aria-label="Kapat"
                onClick={() => setLoginOpen(false)}
                className="rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                ✕
              </button>
            </div>

            {authMode === 'login' ? (
              <form className="space-y-3" onSubmit={submitLogin}>
                <label className="block text-sm">
                  <span className="text-zinc-600">Mail adresi</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-zinc-600">Şifre</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-2 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {authLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={submitRegister}>
                <label className="block text-sm">
                  <span className="text-zinc-600">Ad Soyad</span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Adınız Soyadınız"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-zinc-600">Mail adresi</span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-zinc-600">Telefon</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xx xxx xx xx"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-zinc-600">Şifre oluşturun</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifre"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <label className="block text-sm">
                  <span className="text-zinc-600">Şifre tekrar</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={passwordAgain}
                    onChange={(e) => setPasswordAgain(e.target.value)}
                    placeholder="Şifre tekrar"
                    className="mt-1 h-11 w-full rounded-xl border border-zinc-300 px-3 outline-none transition focus:border-blue-500"
                  />
                </label>

                <p className="text-xs text-zinc-500">
                  Şifre: en az 8 karakter, büyük/küçük harf, rakam ve özel karakter içermelidir.
                </p>

                <div className="rounded-xl border border-zinc-200 p-3">
                  {recaptchaSiteKey ? (
                    <div ref={recaptchaBoxRef} />
                  ) : (
                    <label className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={recaptchaChecked}
                        onChange={(e) => setRecaptchaChecked(e.target.checked)}
                      />
                      Ben robot değilim (geliştirme modu)
                    </label>
                  )}
                </div>

                <label className="flex items-start gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={kvkkConsent}
                    onChange={(e) => setKvkkConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  KVKK bilgilendirmesini okudum ve onaylıyorum.
                </label>

                <label className="flex items-start gap-2 text-sm text-zinc-700">
                  <input
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  SMS ile bilgilendirme ve kampanya iletilerini almayı kabul ediyorum.
                </label>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="mt-1 h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-60"
                >
                  {authLoading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </button>
              </form>
            )}

            {authError && <p className="mt-3 text-sm font-medium text-red-600">{authError}</p>}
            {authOk && <p className="mt-3 text-sm font-medium text-emerald-600">{authOk}</p>}

            <div className="mt-4 flex items-center justify-between gap-3 text-sm">
              <button type="button" className="font-medium text-blue-600 hover:text-blue-500">
                Şifremi unuttum
              </button>
              <p className="text-zinc-500">
                {authMode === 'login' ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
                <button
                  type="button"
                  className="font-semibold text-blue-600 hover:text-blue-500"
                  onClick={() => {
                    setAuthError(null);
                    setAuthOk(null);
                    setAuthMode((m) => (m === 'login' ? 'register' : 'login'));
                  }}
                >
                  {authMode === 'login' ? 'Kaydolun' : 'Giriş yapın'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </SiteAuthContext.Provider>
  );
}
