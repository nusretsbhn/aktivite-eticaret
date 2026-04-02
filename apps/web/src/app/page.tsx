import { HomeHero } from '@/components/site/home-hero';
import { HomeBanners } from '@/components/site/home-banners';
import { HomeBoatTourSection } from '@/components/site/home-boat-tour-section';
import { HomeActionsWidget } from '@/components/site/home-actions-widget';
import { HomeCategoriesSection } from '@/components/site/home-categories-section';
import { HomeLocationWidget } from '@/components/site/home-location-widget';
import { HomeActivitiesSection } from '@/components/site/home-activities-section';
import { HomePackagesSection } from '@/components/site/home-packages-section';
import { HomeVillasSection } from '@/components/site/home-villas-section';
import { HomeBenefitsSection } from '@/components/site/home-benefits-section';
import { HomeFaqSection } from '@/components/site/home-faq-section';
import { HomeHoneymoonVillasSection } from '@/components/site/home-honeymoon-villas-section';
import { HomeVillaRegionBannersSection } from '@/components/site/home-villa-region-banners-section';
import { HomeVillaSpotlightWidget } from '@/components/site/home-villa-spotlight-widget';
import { SiteFooter } from '@/components/site/site-footer';
import { readActivities } from '@/lib/admin-activities-server';
import { readPackages } from '@/lib/admin-packages-server';
import { readVillas } from '@/lib/admin-villas-server';
import { readFaqs } from '@/lib/faq-server';
import { readSettings } from '@/lib/admin-settings-server';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_VILLA_RENTAL,
  isSiteProductEnabled,
  normalizeEnabledSiteProducts,
} from '@/lib/site-product-types';

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
  const bm = settings.bannerManagement;
  const enabled = sm?.enabledSiteProducts;
  const enabledProducts = normalizeEnabledSiteProducts(enabled);
  const showActivity = isSiteProductEnabled(enabled, SITE_PRODUCT_ACTIVITY);
  const showBoatTour = isSiteProductEnabled(enabled, SITE_PRODUCT_BOAT_TOUR);
  const showVillaRental = isSiteProductEnabled(enabled, SITE_PRODUCT_VILLA_RENTAL);
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
      <HomeBanners
        sliderBanners={bm?.sliderBanners ?? []}
        rightBanner={bm?.rightBanner}
      />
      {showVillaRental && spotlightVillas.length > 0 && <HomeVillaSpotlightWidget villas={spotlightVillas} />}
      {showBoatTour && <HomeBoatTourSection />}
      {showActivity && (
        <>
          <HomeActivitiesSection
            activities={activities}
            settings={settings}
          />
          <HomeActionsWidget />
          <HomeCategoriesSection
            settings={settings}
            activities={activities}
          />
          <HomePackagesSection
            packages={packages}
            activities={activities}
          />
          <HomeLocationWidget
            settings={settings}
            activities={activities}
          />
        </>
      )}
      {showVillaRental && <HomeVillaRegionBannersSection villas={villas} settings={settings} />}
      {showVillaRental && <HomeVillasSection villas={villas} settings={settings} />}
      <HomeBenefitsSection />
      {showVillaRental && <HomeHoneymoonVillasSection villas={villas} settings={settings} />}
      <HomeFaqSection faqs={faqs} />
      <SiteFooter
        socialMedia={settings.socialMedia}
        footerManagement={settings.footerManagement}
      />
    </div>
  );
}
