import { BlogListingClient } from './blog-listing-client';

import { readSettings } from '@/lib/admin-settings-server';

export default async function BlogPage() {
  const settings = await readSettings();
  return <BlogListingClient settings={settings} />;
}
