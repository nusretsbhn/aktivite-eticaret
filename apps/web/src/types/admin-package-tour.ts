import type { GalleryItem } from '@/types/admin-activity';

export type PackageTourChildAgeRule = {
  id: string;
  childOrder: number;
  minAge: number;
  maxAge: number;
  discountPercent: number;
};

export type PackageTourPriceRule = {
  id: string;
  fromDate: string;
  toDate: string;
  costPrice: number;
  profitPercent: number;
  singleRoomMultiplier: number;
  roundingMode: 'up' | 'down';
  childAgeRules: PackageTourChildAgeRule[];
};

export type AdminPackageTour = {
  id: string;
  packageTourId: string;
  packageName: string;
  conceptName: string;
  description: string;
  nightCount: number;
  dayCount: number;
  includedServiceIds: string[];
  paidServiceIds: string[];
  activityIds: string[];
  gallery: GalleryItem[];
  priceRules: PackageTourPriceRule[];
  coverImageUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

