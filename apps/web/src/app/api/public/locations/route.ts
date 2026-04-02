import { NextResponse } from 'next/server';

import { readActivities } from '@/lib/admin-activities-server';

export async function GET() {
  const all = await readActivities();
  const set = new Set<string>();
  for (const a of all) {
    const loc = (a.location ?? '').trim();
    if (loc) set.add(loc);
  }
  const locations = [...set].sort((a, b) => a.localeCompare(b, 'tr'));
  return NextResponse.json({ locations });
}

