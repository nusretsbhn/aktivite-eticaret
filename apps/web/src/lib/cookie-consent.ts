/** İleride analitik vb. için dinlenebilir (yalnızca kullanıcı kabul ettiyse). */
export const COOKIE_CONSENT_ACCEPTED_EVENT = 'bodrum:cookie-consent-accepted';

/** Site genelinde çerez tercihini saklamak için (KVKK / aydınlatma metni ile uyumlu kullanım için). */
export const COOKIE_CONSENT_NAME = 'bodrum_cookie_consent';
export const COOKIE_CONSENT_VALUE = 'accepted';

const MAX_AGE_SEC = 60 * 60 * 24 * 400; // ~400 gün

export function setCookieConsentCookie(): void {
  if (typeof document === 'undefined') return;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [
    `${COOKIE_CONSENT_NAME}=${encodeURIComponent(COOKIE_CONSENT_VALUE)}`,
    'path=/',
    `max-age=${MAX_AGE_SEC}`,
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  document.cookie = parts.join('; ');
}

export function hasCookieConsentCookie(): boolean {
  if (typeof document === 'undefined') return false;
  const m = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_CONSENT_NAME.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  );
  return decodeURIComponent(m?.[1] ?? '') === COOKIE_CONSENT_VALUE;
}

/** Analitik veya üçüncü taraf scriptleri yalnızca kabul sonrası yüklemek için dinlenebilir. */
export function dispatchCookieConsentAccepted(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_ACCEPTED_EVENT));
}
