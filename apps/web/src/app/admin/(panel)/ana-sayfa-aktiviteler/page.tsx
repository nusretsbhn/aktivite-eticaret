import { readActivities } from '@/lib/admin-activities-server';
import { readSettings } from '@/lib/admin-settings-server';

import { HomeActivitiesOrderClient } from './home-activities-order-client';

export default async function AnaSayfaAktivitelerPage() {
  const [settings, activities] = await Promise.all([readSettings(), readActivities()]);
  return <HomeActivitiesOrderClient initialSettings={settings} initialActivities={activities} />;
}
