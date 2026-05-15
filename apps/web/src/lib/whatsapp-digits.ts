/**
 * Kullanıcı girdisini wa.me için ulusal formata çevirir (sadece rakamlar).
 * Örnek: 0553 688 27 34 → 905536882734, +90 553… → 905536882734
 */
export function normalizeWhatsAppDigits(input: string): string | null {
  const d = String(input ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.length < 10 || d.length > 15) return null;

  if (d.startsWith('90') && d.length >= 12) return d;
  if (d.startsWith('0') && d.length === 11) return `90${d.slice(1)}`;
  if (d.length === 10 && d.startsWith('5')) return `90${d}`;

  return d;
}

/** `text` boşsa yalnızca sohbet açılır, hazır mesaj eklenmez. */
export function buildWhatsAppChatUrl(phoneDigits: string, text?: string): string {
  const t = (text ?? '').trim();
  if (!t) return `https://wa.me/${phoneDigits}`;
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(t)}`;
}

/** `tel:` bağlantısı (mobilde doğrudan arama başlatır). */
export function buildTelUrl(phoneDigits: string): string {
  const d = String(phoneDigits ?? '').replace(/\D/g, '');
  if (!d) return 'tel:';
  return `tel:+${d}`;
}
