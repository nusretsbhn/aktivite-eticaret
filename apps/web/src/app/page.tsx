import { HomeHero } from '@/components/site/home-hero';
import { deriveHomePageFlags, HomePageMiddleSections } from '@/components/site/home-page-middle-sections';
import { SiteFooter } from '@/components/site/site-footer';
import { readActivities } from '@/lib/admin-activities-server';
import { readPackages } from '@/lib/admin-packages-server';
import { readVillas } from '@/lib/admin-villas-server';
import { readFaqs } from '@/lib/faq-server';
import { readSettings } from '@/lib/admin-settings-server';
import { normalizeEnabledSiteProducts } from '@/lib/site-product-types';

export default function Home() {
  // Public homepage reads from same settings store.
  // Later we can split this into a public API if needed.
  const settingsPromise = readSettings();
  const activitiesPromise = readActivities();
  const packagesPromise = readPackages();
  const faqsPromise = readFaqs();
  const villasPromise = readVillas();
  return (
    <HomePage
      settingsPromise={settingsPromise}
      activitiesPromise={activitiesPromise}
      packagesPromise={packagesPromise}
      faqsPromise={faqsPromise}
      villasPromise={villasPromise}
    />
  );
}

async function HomePage({
  settingsPromise,
  activitiesPromise,
  packagesPromise,
  faqsPromise,
  villasPromise,
}: {
  settingsPromise: ReturnType<typeof readSettings>;
  activitiesPromise: ReturnType<typeof readActivities>;
  packagesPromise: ReturnType<typeof readPackages>;
  faqsPromise: ReturnType<typeof readFaqs>;
  villasPromise: ReturnType<typeof readVillas>;
}) {
  const [settings, activities, packages, faqs, villas] = await Promise.all([
    settingsPromise,
    activitiesPromise,
    packagesPromise,
    faqsPromise,
    villasPromise,
  ]);
  const sm = settings.siteManagement;
  const enabled = sm?.enabledSiteProducts;
  const enabledProducts = normalizeEnabledSiteProducts(enabled);
  const { showActivity, showBoatTour, showVillaRental } = deriveHomePageFlags(settings);
  const spotlightVillas = showVillaRental
    ? villas
        .filter((v) => v.isActive)
        .slice()
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
    : [];
  const villaRegionOptions = showVillaRental
    ? Array.from(
        new Set(
          villas.flatMap((v) =>
            [v.city, v.district, v.region]
              .map((x) => (typeof x === 'string' ? x.trim() : ''))
              .filter(Boolean),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, 'tr'))
    : [];

  return (
    <div className="bg-white">
      <HomeHero
        logoUrl={sm?.logoUrl}
        darkLogoUrl={sm?.darkLogoUrl}
        slides={sm?.slides ?? []}
        enabledSiteProducts={enabledProducts}
        villaRegionOptions={villaRegionOptions}
      />
      <HomePageMiddleSections
        settings={settings}
        activities={activities}
        packages={packages}
        faqs={faqs}
        villas={villas}
        spotlightVillas={spotlightVillas}
        showActivity={showActivity}
        showBoatTour={showBoatTour}
        showVillaRental={showVillaRental}
      />
      <SiteFooter
        socialMedia={settings.socialMedia}
        footerManagement={settings.footerManagement}
      />
    </div>
  );
}
