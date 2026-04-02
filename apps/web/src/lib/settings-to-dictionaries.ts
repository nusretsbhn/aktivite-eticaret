import type { AdminDictionaries } from '@/types/admin-dictionary';
import type { AdminSettings } from '@/types/admin-settings';

export function settingsToAdminDictionaries(settings: AdminSettings): AdminDictionaries {
  const mainCategories = settings.categories.map((c) => ({ id: c.id, label: c.name }));
  const subCategoriesByMain: Record<string, { id: string; label: string }[]> = {};
  for (const c of settings.categories) {
    subCategoriesByMain[c.id] = c.subcategories.map((s) => ({ id: s.id, label: s.name }));
  }

  const mapDict = (group: 'include' | 'exclude' | 'feature') =>
    settings.dictionaries
      .filter((d) => d.group === group)
      .map((d) => ({
        id: d.id,
        label: d.label,
        icon: d.icon,
        ...(d.iconKey ? { iconKey: d.iconKey } : {}),
      }));

  return {
    mainCategories,
    subCategoriesByMain,
    includes: mapDict('include'),
    excludes: mapDict('exclude'),
    features: mapDict('feature'),
  };
}
