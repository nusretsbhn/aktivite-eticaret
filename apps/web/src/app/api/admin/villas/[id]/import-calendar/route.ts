import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import {
  applyLegacyAvailability,
  applyLegacyPrices,
  parseLegacyAvailabilityJson,
  parseLegacyPricesJson,
} from '@/lib/legacy-villa-calendar-import';
import { normalizeVillaBody, validateVillaRequired } from '@/lib/admin-villa-normalize';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import type { AdminVilla, AdminVillaInput } from '@/types/admin-villa';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

type RouteContext = { params: Promise<{ id: string }> };

function parseMode(v: FormDataEntryValue | null): 'merge' | 'replace' {
  const s = String(v ?? '').toLowerCase();
  return s === 'replace' ? 'replace' : 'merge';
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Geçersiz form' }, { status: 400 });
  }

  const pricesFile = form.get('prices');
  const availabilityFile = form.get('availability');
  const priceMode = parseMode(form.get('priceMode'));
  const availabilityMode = parseMode(form.get('availabilityMode'));

  const hasPrices = pricesFile instanceof File && pricesFile.size > 0;
  const hasAvailability = availabilityFile instanceof File && availabilityFile.size > 0;

  if (!hasPrices && !hasAvailability) {
    return NextResponse.json(
      { error: 'En az bir JSON dosyası seçin (fiyat ve/veya müsaitlik).' },
      { status: 400 },
    );
  }

  if (hasPrices && pricesFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Fiyat dosyası çok büyük.' }, { status: 400 });
  }
  if (hasAvailability && availabilityFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Müsaitlik dosyası çok büyük.' }, { status: 400 });
  }

  let pricesParsed: unknown;
  let availabilityParsed: unknown;

  if (hasPrices) {
    try {
      pricesParsed = JSON.parse(await (pricesFile as File).text());
    } catch {
      return NextResponse.json({ error: 'Fiyat JSON okunamadı.' }, { status: 400 });
    }
  }

  if (hasAvailability) {
    try {
      availabilityParsed = JSON.parse(await (availabilityFile as File).text());
    } catch {
      return NextResponse.json({ error: 'Müsaitlik JSON okunamadı.' }, { status: 400 });
    }
  }

  const all = await readVillas();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return notFound();

  const current = all[idx];
  if (!current) return notFound();

  let nextPrices = current.prices;
  let nextAvailability = current.availability;
  let importedPriceCount = 0;
  let importedAvailabilityDateCount = 0;

  if (hasPrices) {
    const imported = parseLegacyPricesJson(pricesParsed);
    importedPriceCount = imported.length;
    if (imported.length === 0) {
      return NextResponse.json({ error: 'Fiyat dosyasında geçerli kayıt bulunamadı.' }, { status: 400 });
    }
    nextPrices = applyLegacyPrices(current.prices, imported, priceMode);
  }

  if (hasAvailability) {
    const av = parseLegacyAvailabilityJson(availabilityParsed);
    importedAvailabilityDateCount = av.datesInFile.length;
    if (av.datesInFile.length === 0) {
      return NextResponse.json({ error: 'Müsaitlik dosyasında geçerli tarih bulunamadı.' }, { status: 400 });
    }
    nextAvailability = applyLegacyAvailability(current.availability, av, availabilityMode);
  }

  const body: Partial<AdminVillaInput> = {
    ...current,
    prices: nextPrices,
    availability: nextAvailability,
  };

  const normalized = normalizeVillaBody(body);
  const err = validateVillaRequired(normalized);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  if (normalized.slug !== current.slug && all.some((v) => v.id !== id && v.slug === normalized.slug)) {
    return NextResponse.json({ error: 'Bu URL (slug) başka bir villada kullanılıyor.' }, { status: 400 });
  }

  const merged: AdminVilla = {
    ...current,
    ...normalized,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = merged;
  await writeVillas(all);

  return NextResponse.json({
    villa: merged,
    summary: {
      priceRows: importedPriceCount,
      availabilityDates: importedAvailabilityDateCount,
    },
  });
}
