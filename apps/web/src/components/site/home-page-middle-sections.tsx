import { Fragment } from 'react';

import { HomeActionsWidget } from '@/components/site/home-actions-widget';
import { HomeActivitiesSection } from '@/components/site/home-activities-section';
import { HomeBanners } from '@/components/site/home-banners';
import { HomeBenefitsSection } from '@/components/site/home-benefits-section';
import { HomeBoatTourSection } from '@/components/site/home-boat-tour-section';
import { HomeFaqSection } from '@/components/site/home-faq-section';
import { HomeHoneymoonVillasSection } from '@/components/site/home-honeymoon-villas-section';
import { HomeActivityMainCategoriesSection } from '@/components/site/home-activity-main-categories-section';
import { HomeLocationWidget } from '@/components/site/home-location-widget';
import { HomePackagesSection } from '@/components/site/home-packages-section';
import { HomeVillaRegionBannersSection } from '@/components/site/home-villa-region-banners-section';
import { HomeVillaSpotlightWidget } from '@/components/site/home-villa-spotlight-widget';
import { HomeVillasByFeatureSection } from '@/components/site/home-villas-by-feature-section';
import { HomeVillasSection } from '@/components/site/home-villas-section';
import type { HomePageSectionId } from '@/lib/home-page-sections';
import { normalizeHomePageSectionOrder } from '@/lib/home-page-sections';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_VILLA_RENTAL,
  isSiteProductEnabled,
} from '@/lib/site-product-types';
import type { AdminPackage } from '@/types/admin-package';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';
import type { FaqItem } from '@/types/faq';

/** Hero slider ile aynı kaynak — ilk dolu görsel URL’i (arka plan için). */
function firstHeroSlideImageUrl(settings: AdminSettings): string | undefined {
  const slides = settings.siteManagement?.slides ?? [];
  for (const s of slides) {
    const u = String(s.imageUrl ?? '').trim();
    if (u) return u;
  }
  return undefined;
}

type Props = {
  settings: AdminSettings;
  activities: AdminActivity[];
  packages: AdminPackage[];
  faqs: FaqItem[];
  villas: AdminVilla[];
  spotlightVillas: AdminVilla[];
  showActivity: boolean;
  showBoatTour: boolean;
  showVillaRental: boolean;
};

function Section({
  id,
  ...props
}: Props & { id: HomePageSectionId }) {
  const { settings, activities, packages, faqs, villas, spotlightVillas, showActivity, showBoatTour, showVillaRental } =
    props;
  const bm = settings.bannerManagement;

  switch (id) {
    case 'banners':
      return (
        <HomeBanners sliderBanners={bm?.sliderBanners ?? []} rightBanner={bm?.rightBanner} />
      );
    case 'villaSpotlight':
      if (!showVillaRental || spotlightVillas.length === 0) return null;
      return <HomeVillaSpotlightWidget villas={spotlightVillas} />;
    case 'boatTour':
      if (!showBoatTour) return null;
      return <HomeBoatTourSection />;
    case 'activities':
      if (!showActivity) return null;
      return <HomeActivitiesSection activities={activities} settings={settings} />;
    case 'actions':
      if (!showActivity) return null;
      return <HomeActionsWidget />;
    case 'activityMainCategories':
      if (!showActivity) return null;
      return <HomeActivityMainCategoriesSection activities={activities} settings={settings} />;
    case 'packages':
      if (!showActivity) return null;
      return <HomePackagesSection packages={packages} activities={activities} settings={settings} />;
    case 'location':
      if (!showActivity) return null;
      return <HomeLocationWidget settings={settings} activities={activities} />;
    case 'villaRegionBanners':
      if (!showVillaRental) return null;
      return <HomeVillaRegionBannersSection villas={villas} settings={settings} />;
    case 'villas':
      if (!showVillaRental) return null;
      return <HomeVillasSection villas={villas} settings={settings} />;
    case 'villasByFeature':
      if (!showVillaRental) return null;
      return (
        <HomeVillasByFeatureSection
          villas={villas}
          settings={settings}
          heroBackgroundImageUrl={firstHeroSlideImageUrl(settings)}
        />
      );
    case 'benefits':
      return <HomeBenefitsSection />;
    case 'honeymoonVillas':
      if (!showVillaRental) return null;
      return <HomeHoneymoonVillasSection villas={villas} settings={settings} />;
    case 'faq':
      return <HomeFaqSection faqs={faqs} />;
    default:
      return null;
  }
}

/** Hero / footer hariç ana gövde blokları — sıra ayarlardan gelir. */
export function HomePageMiddleSections(props: Props) {
  const order = normalizeHomePageSectionOrder(props.settings.siteManagement?.homePageSectionOrder);
  return (
    <>
      {order.map((id) => (
        <Fragment key={id}>
          <Section id={id} {...props} />
        </Fragment>
      ))}
    </>
  );
}

export function deriveHomePageFlags(settings: AdminSettings) {
  const enabled = settings.siteManagement?.enabledSiteProducts;
  return {
    showActivity: isSiteProductEnabled(enabled, SITE_PRODUCT_ACTIVITY),
    showBoatTour: isSiteProductEnabled(enabled, SITE_PRODUCT_BOAT_TOUR),
    showVillaRental: isSiteProductEnabled(enabled, SITE_PRODUCT_VILLA_RENTAL),
  };
}
