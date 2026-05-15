import { readActivities } from '@/lib/admin-activities-server';
import { readSettings } from '@/lib/admin-settings-server';

import { HomeActivityWidgetsAdminClient } from './home-activity-widgets-admin-client';

export default async function AnaSayfaAktiviteWidgetlariPage() {
  const [settings, activities] = await Promise.all([readSettings(), readActivities()]);
  return (
    <HomeActivityWidgetsAdminClient initialSettings={settings} initialActivities={activities} />
  );
}
