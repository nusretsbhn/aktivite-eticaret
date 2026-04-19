import { ContactPageClient } from '@/app/iletisim/contact-page-client';
import { readSettings } from '@/lib/admin-settings-server';

export default async function ContactPage() {
  const settings = await readSettings();
  return <ContactPageClient settings={settings} />;
}
