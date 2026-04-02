import { renderToBuffer } from '@react-pdf/renderer';
import QRCode from 'qrcode';

import { readSettings } from '@/lib/admin-settings-server';
import { isOrderTicketEligible } from '@/lib/order-ticket-eligibility';
import type { Order } from '@/types/order';
import { resolveLogoDataUrlForPdf } from '@/lib/ticket-logo';
import { registerTicketFonts } from '@/lib/ticket-pdf-fonts';

import { TicketPdfDocument } from '@/lib/ticket-pdf-document';

const MAX_LOGO_DATA_URL_CHARS = 4_000_000;

async function renderTicketPdf(
  order: Order,
  qrDataUrl: string,
  fromLabel: string,
  toLabel: string,
  fontFamily: string,
  logoSrc: string | null,
): Promise<Buffer> {
  return renderToBuffer(
    <TicketPdfDocument
      order={order}
      qrDataUrl={qrDataUrl}
      fromLabel={fromLabel}
      toLabel={toLabel}
      fontFamily={fontFamily}
      logoSrc={logoSrc}
    />,
  );
}

export async function buildOrderTicketPdfBuffer(order: Order, verifyUrl: string): Promise<Buffer> {
  const preferredFont = registerTicketFonts();
  const settings = await readSettings();
  let logoSrc = await resolveLogoDataUrlForPdf(settings.siteManagement?.logoUrl);
  if (logoSrc && logoSrc.length > MAX_LOGO_DATA_URL_CHARS) {
    console.warn('[ticket-pdf] Logo çok büyük, biletten çıkarıldı');
    logoSrc = null;
  }

  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 1,
    width: 280,
    color: { dark: '#000000', light: '#ffffff' },
  });
  const fromLabel = (order.departurePlace || order.location || 'Bodrum').slice(0, 22).toLocaleUpperCase('tr-TR');
  const toLabel = '12 ADALAR';

  const attempts: Array<{ name: string; font: string; logo: string | null }> = [
    { name: 'noto+logo', font: preferredFont, logo: logoSrc },
    { name: 'noto-only', font: preferredFont, logo: null },
    { name: 'helvetica', font: 'Helvetica', logo: null },
  ];

  let lastError: unknown;
  for (const a of attempts) {
    try {
      return await renderTicketPdf(order, qrDataUrl, fromLabel, toLabel, a.font, a.logo);
    } catch (e) {
      lastError = e;
      console.error(`[ticket-pdf] PDF denemesi başarısız (${a.name})`, e);
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(String(lastError ?? 'PDF oluşturulamadı'));
}

/** Önizleme/indir: her seferinde güncel şablonla üretilir. */
export async function getOrderTicketPdfBuffer(order: Order, baseUrl: string): Promise<Buffer | null> {
  if (!isOrderTicketEligible(order)) return null;
  const root = baseUrl.replace(/\/$/, '');
  const verifyUrl = `${root}/bilet/${order.id}`;
  return buildOrderTicketPdfBuffer(order, verifyUrl);
}
