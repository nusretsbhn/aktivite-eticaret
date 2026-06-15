import type { AdminSettings } from '@/types/admin-settings';

export const ACTIVITY_PRICE_CONTACT_LABEL = 'Fiyat için iletişime geçin';

export function isActivityPricesHidden(settings: AdminSettings | null | undefined): boolean {
  return Boolean(settings?.siteManagement?.hideActivityPrices);
}
