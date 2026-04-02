export type GalleryItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  sortOrder: number;
  isCover: boolean;
};

export type PriceEntry = {
  date: string; // YYYY-MM-DD
  price: number;
};

/** Sadece dolu/bakım günleri saklanır; kayıt yoksa o gün müsaittir. */
export type AvailabilityDayStatus = 'available' | 'full' | 'maintenance';

export type AvailabilityEntry = {
  date: string; // YYYY-MM-DD
  status: 'full' | 'maintenance';
};

export type TripEntry = {
  id: string;
  departureTime: string; // HH:mm
  arrivalTime: string; // HH:mm
  durationHours: number;
};

export type ActivityBoatType = 'family' | 'standard';

export type AdminActivity = {
  id: string;
  activityId: string;
  name: string;
  companyName?: string;
  documentNo?: string;
  authorizedFullName?: string;
  authorizedPhone?: string;
  mainCategory: string;
  /** Bir aktivite birden fazla alt kategoriye ait olabilir */
  subCategoryIds: string[];
  /** Kullanıcı arayüzündeki arama widget'ında seçilecek lokasyon (örn. Bodrum, Fethiye) */
  location: string;
  departurePlace: string;
  description: string;
  tourProgram: string;
  includedItemIds: string[];
  excludedItemIds: string[];
  /** Ayarlardaki etiket kimlikleri */
  tagIds: string[];
  /** Kişi kapasitesi */
  capacity: number;
  /** Tur konsepti: aile teknesi veya standart tekne */
  boatType: ActivityBoatType;
  /** Fiyat yerine "Sor Sat" akışını işaretler */
  askSell: boolean;
  /** Rezervasyon ödeme adımında uygulanacak ön ödeme oranı (1-100) */
  prepaymentPercent: number;
  featureIds: string[];
  isActive: boolean;
  gallery: GalleryItem[];
  prices: PriceEntry[];
  /** Tarih bazlı dolu/bakım; boş günler müsait kabul edilir */
  availability: AvailabilityEntry[];
  trips: TripEntry[];
  createdAt: string;
  updatedAt: string;
};

export type AdminActivityInput = Omit<
  AdminActivity,
  'id' | 'createdAt' | 'updatedAt' | 'gallery' | 'prices' | 'availability' | 'trips'
> & {
  gallery?: GalleryItem[];
  prices?: PriceEntry[];
  availability?: AvailabilityEntry[];
  trips?: TripEntry[];
};
