import { NextResponse } from 'next/server';

import { readActivities } from '@/lib/admin-activities-server';
import { readSettings } from '@/lib/admin-settings-server';

type CategoryOption = { id: string; name: string };

export async function GET() {
  const [activities, settings] = await Promise.all([readActivities(), readSettings()]);

  const activeActivities = (activities ?? []).filter((a) => a?.isActive);
  const categoryNameById = new Map((settings.categories ?? []).map((c) => [c.id, c.name]));
  const locationsSet = new Set<string>();
  const categoryIdsByLocation = new Map<string, Set<string>>();

  for (const activity of activeActivities) {
    const location = String(activity.location ?? '').trim();
    if (!location) continue;

    locationsSet.add(location);
    const categoryId = String(activity.mainCategory ?? '').trim();
    if (!categoryId || !categoryNameById.has(categoryId)) continue;

    const locationCategoryIds = categoryIdsByLocation.get(location) ?? new Set<string>();
    locationCategoryIds.add(categoryId);
    categoryIdsByLocation.set(location, locationCategoryIds);
  }

  const locations = [...locationsSet].sort((a, b) => a.localeCompare(b, 'tr'));
  const categoriesByLocation: Record<string, CategoryOption[]> = {};
  for (const location of locations) {
    const categoryIds = [...(categoryIdsByLocation.get(location) ?? new Set<string>())];
    categoriesByLocation[location] = categoryIds
      .map((id) => ({ id, name: categoryNameById.get(id) ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  return NextResponse.json({ locations, categoriesByLocation });
}
