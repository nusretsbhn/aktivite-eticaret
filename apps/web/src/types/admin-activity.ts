export type GalleryItem = {
  id: string;
  url: string;
  type: 'image' | 'video';
  sortOrder: number;
  isCover: boolean;
};

export type PriceEntry = {
  date: string; // YYYY-MM-DD
  /** Yetişkin (13+) — tek fiyatlı eski kayıtlar için birincil alan */
  price: number;
  /** Çocuk (3-12), yoksa `price` kullanılır */
  priceChild?: number;
  /** Bebek (0-2), yoksa `price` kullanılır */
  priceInfant?: number;
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

/** Sefer listesi veya esnek saat penceresi */
export type ActivityScheduleMode = 'trips' | 'flexible';

export type FlexibleSchedule = {
  /** Müşteriye gösterilen kısa metin (örn. "Gün boyu esnek", "Randevuya göre") */
  label?: string;
  /** Opsiyonel başlangıç HH:mm */
  windowStart?: string;
  /** Opsiyonel bitiş HH:mm */
  windowEnd?: string;
  /** Tahmini tur süresi (saat); boşsa pencereden hesaplanabilir */
  durationHours?: number;
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
  /** trips: sabit seferler; flexible: esnek aktivite saati */
  scheduleMode?: ActivityScheduleMode;
  flexibleSchedule?: FlexibleSchedule;
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
  scheduleMode?: ActivityScheduleMode;
  flexibleSchedule?: FlexibleSchedule;
};
