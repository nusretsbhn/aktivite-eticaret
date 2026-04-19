import { readSettings } from '@/lib/admin-settings-server';

import { HesapSiparislerClient } from '../hesap-siparisler-client';

export default async function HesapSiparislerPage() {
  const settings = await readSettings();
  const logoUrl = settings.siteManagement?.logoUrl;
  return (
    <HesapSiparislerClient
      logoUrl={logoUrl}
      socialMedia={settings.socialMedia}
      footerManagement={settings.footerManagement}
      enabledSiteProducts={settings.siteManagement?.enabledSiteProducts}
    />
  );
}
