import { readSettings } from '@/lib/admin-settings-server';

import { HesapProfileClient } from './hesap-profile-client';

export default async function HesapPage() {
  const settings = await readSettings();
  const logoUrl = settings.siteManagement?.logoUrl;
  return (
    <HesapProfileClient
      logoUrl={logoUrl}
      socialMedia={settings.socialMedia}
      footerManagement={settings.footerManagement}
      enabledSiteProducts={settings.siteManagement?.enabledSiteProducts}
    />
  );
}
