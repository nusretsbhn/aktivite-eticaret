import { NextResponse } from 'next/server';

import { readActivities } from '@/lib/admin-activities-server';
import { readPackages } from '@/lib/admin-packages-server';
import { computePackagePriceForDate } from '@/lib/package-pricing';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const packageId = String(searchParams.get('packageId') ?? '').trim();
  const date = String(searchParams.get('date') ?? '').trim();

  if (!packageId || !date) {
    return NextResponse.json({ error: 'packageId ve date zorunlu.' }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Tarih formatı YYYY-MM-DD olmalı.' }, { status: 400 });
  }

  const packages = await readPackages();
  const pkg = packages.find((p) => p.id === packageId || p.packageId === packageId);
  if (!pkg || !pkg.isActive) {
    return NextResponse.json({ error: 'Paket bulunamadı.' }, { status: 404 });
  }

  const activities = (await readActivities()).filter((a) => a.isActive);
  const result = computePackagePriceForDate(pkg, activities, date);

  return NextResponse.json({
    packageId: pkg.packageId,
    date,
    total: result.total,
    missingActivityIds: result.missingActivityIds,
    breakdown: result.breakdown,
  });
}

