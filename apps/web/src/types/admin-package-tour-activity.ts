export type PackageTourActivityPriceEntry = {
  date: string;
  price: number;
  priceChild?: number;
  priceInfant?: number;
};

export type PackageTourGalleryItem = {
  id: string;
  url: string;
  sortOrder: number;
  isCover: boolean;
};

export type AdminPackageTourActivity = {
  id: string;
  activityId: string;
  name: string;
  description: string;
  location: string;
  category: string;
  gallery: PackageTourGalleryItem[];
  videoUrl: string;
  prices: PackageTourActivityPriceEntry[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminPackageTourActivityInput = Omit<AdminPackageTourActivity, 'id' | 'activityId' | 'createdAt' | 'updatedAt'> & {
  activityId?: string;
};

