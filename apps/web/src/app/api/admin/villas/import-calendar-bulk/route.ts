import { NextResponse } from 'next/server';

import {
  canManageVilla,
  requireAdminSession,
  unauthorized,
} from '@/lib/admin-api-auth';
import { normalizeVillaBody, validateVillaRequired } from '@/lib/admin-villa-normalize';
import {
  applyLegacyAvailability,
  applyLegacyPrices,
  parseLegacyAvailabilityJson,
  parseLegacyPricesJson,
} from '@/lib/legacy-villa-calendar-import';
import { matchVillaByDisplayName } from '@/lib/villa-display-name-match';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import type { AdminVilla, AdminVillaInput } from '@/types/admin-villa';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function parseMode(v: FormDataEntryValue | null): 'merge' | 'replace' {
  const s = String(v ?? '').toLowerCase();
  return s === 'replace' ? 'replace' : 'merge';
}

type BulkPartResult = {
  success: number;
  failed: number;
  failedKeys: string[];
};

function emptyPart(): BulkPartResult {
  return { success: 0, failed: 0, failedKeys: [] };
}

function deepCloneVilla(v: AdminVilla): AdminVilla {
  return JSON.parse(JSON.stringify(v)) as AdminVilla;
}

export async function POST(request: Request) {
  const session = await requireAdminSession({ allowRoles: ['admin', 'alt_bayi'] });
  if (!session) return unauthorized();

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
      { error: 'En az bir JSON dosyası seçin (toplu fiyat ve/veya toplu müsaitlik).' },
      { status: 400 },
    );
  }

  if (hasPrices && pricesFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Fiyat dosyası çok büyük.' }, { status: 400 });
  }
  if (hasAvailability && availabilityFile.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Müsaitlik dosyası çok büyük.' }, { status: 400 });
  }

  let pricesDoc: unknown;
  let availabilityDoc: unknown;

  if (hasPrices) {
    try {
      pricesDoc = JSON.parse(await (pricesFile as File).text());
    } catch {
      return NextResponse.json({ error: 'Fiyat JSON okunamadı.' }, { status: 400 });
    }
  }

  if (hasAvailability) {
    try {
      availabilityDoc = JSON.parse(await (availabilityFile as File).text());
    } catch {
      return NextResponse.json({ error: 'Müsaitlik JSON okunamadı.' }, { status: 400 });
    }
  }

  if (hasPrices && (pricesDoc === null || typeof pricesDoc !== 'object' || Array.isArray(pricesDoc))) {
    return NextResponse.json(
      { error: 'Fiyat JSON kökü bir nesne olmalı: { "Villa adı": [ ... ], ... }' },
      { status: 400 },
    );
  }

  if (hasAvailability && (availabilityDoc === null || typeof availabilityDoc !== 'object' || Array.isArray(availabilityDoc))) {
    return NextResponse.json(
      { error: 'Müsaitlik JSON kökü bir nesne olmalı: { "Villa adı": [ ... ], ... }' },
      { status: 400 },
    );
  }

  const all = await readVillas();
  const scoped = all.filter((v) => canManageVilla(session, v));
  const working = new Map<string, AdminVilla>(scoped.map((v) => [v.id, deepCloneVilla(v)]));

  const priceResult = hasPrices ? emptyPart() : null;
  const availabilityResult = hasAvailability ? emptyPart() : null;

  if (hasPrices && pricesDoc && priceResult) {
    const obj = pricesDoc as Record<string, unknown>;
    for (const rawKey of Object.keys(obj)) {
      const matched = matchVillaByDisplayName(scoped, rawKey);
      if (!matched.ok) {
        priceResult.failed += 1;
        priceResult.failedKeys.push(rawKey);
        continue;
      }
      const val = obj[rawKey];
      const imported = parseLegacyPricesJson(val);
      if (imported.length === 0) {
        priceResult.failed += 1;
        priceResult.failedKeys.push(rawKey);
        continue;
      }
      const id = matched.villa.id;
      const cur = working.get(id);
      if (!cur) {
        priceResult.failed += 1;
        priceResult.failedKeys.push(rawKey);
        continue;
      }
      const nextPrices = applyLegacyPrices(cur.prices, imported, priceMode);
      const body: Partial<AdminVillaInput> = { ...cur, prices: nextPrices };
      const normalized = normalizeVillaBody(body);
      const err = validateVillaRequired(normalized);
      if (err) {
        priceResult.failed += 1;
        priceResult.failedKeys.push(rawKey);
        continue;
      }
      working.set(id, {
        ...cur,
        ...normalized,
        id: cur.id,
        createdByUserId: cur.createdByUserId,
        createdByEmail: cur.createdByEmail,
        createdAt: cur.createdAt,
        updatedAt: new Date().toISOString(),
      });
      priceResult.success += 1;
    }
  }

  if (hasAvailability && availabilityDoc && availabilityResult) {
    const obj = availabilityDoc as Record<string, unknown>;
    for (const rawKey of Object.keys(obj)) {
      const matched = matchVillaByDisplayName(scoped, rawKey);
      if (!matched.ok) {
        availabilityResult.failed += 1;
        availabilityResult.failedKeys.push(rawKey);
        continue;
      }
      const val = obj[rawKey];
      const av = parseLegacyAvailabilityJson(val);
      if (av.datesInFile.length === 0) {
        availabilityResult.failed += 1;
        availabilityResult.failedKeys.push(rawKey);
        continue;
      }
      const id = matched.villa.id;
      const cur = working.get(id);
      if (!cur) {
        availabilityResult.failed += 1;
        availabilityResult.failedKeys.push(rawKey);
        continue;
      }
      const nextAvailability = applyLegacyAvailability(cur.availability, av, availabilityMode);
      const body: Partial<AdminVillaInput> = { ...cur, availability: nextAvailability };
      const normalized = normalizeVillaBody(body);
      const err = validateVillaRequired(normalized);
      if (err) {
        availabilityResult.failed += 1;
        availabilityResult.failedKeys.push(rawKey);
        continue;
      }
      working.set(id, {
        ...cur,
        ...normalized,
        id: cur.id,
        createdByUserId: cur.createdByUserId,
        createdByEmail: cur.createdByEmail,
        createdAt: cur.createdAt,
        updatedAt: new Date().toISOString(),
      });
      availabilityResult.success += 1;
    }
  }

  const nextList: AdminVilla[] = all.map((v) => working.get(v.id) ?? v);
  await writeVillas(nextList);

  return NextResponse.json({
    prices: priceResult ?? null,
    availability: availabilityResult ?? null,
  });
}
