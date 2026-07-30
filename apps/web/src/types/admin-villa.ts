import type { AvailabilityEntry, GalleryItem, PriceEntry } from '@/types/admin-activity';

export type VillaPaymentCurrency = 'TRY' | 'USD' | 'EUR' | 'GBP';

/** Açık / Kapalı / Çocuk / Ortak */
export type VillaPoolType = 'open' | 'indoor' | 'kids' | 'shared';

export type VillaPool = {
  id: string;
  poolType: VillaPoolType;
  heated: boolean;
  widthCm: number;
  lengthCm: number;
  depthCm: number;
  note: string;
};

export type VillaEquipmentItem = {
  id: string;
  icon: string;
  description: string;
};

export type VillaRoomInventoryItem = {
  id: string;
  name: string;
};

export type VillaRoom = {
  id: string;
  name: string;
  items: VillaRoomInventoryItem[];
};

export type AdminVilla = {
  id: string;
  displayName: string;
  legalName: string;
  documentNo: string;
  isActive: boolean;
  /** Ayarlar → Etiket’ten seçilen etiket kimlikleri */
  tagIds: string[];
  guestCount: number;
  bedroomCount: number;
  bathroomCount: number;
  squareMeters: number;
  slug: string;
  description: string;
  ownerFullName: string;
  ownerPhone: string;
  ownerIban: string;
  city: string;
  district: string;
  region: string;
  mapUrl: string;
  addressLine: string;
  minStayNights: number;
  cleaningFee: number;
  freeCleaningThreshold: number;
  damageDeposit: number;
  paymentCurrency: VillaPaymentCurrency;
  commissionPercent: number;
  prepaymentPercent: number;
  pools: VillaPool[];
  featuredItems: VillaEquipmentItem[];
  amenities: VillaEquipmentItem[];
  houseRules: VillaEquipmentItem[];
  rooms: VillaRoom[];
  utilitiesNote: string;
  nearbyNote: string;
  sellerNote: string;
  /** Gecelik fiyat takvimi (aktivite ile aynı yapı) */
  gallery: GalleryItem[];
  prices: PriceEntry[];
  availability: AvailabilityEntry[];
  /** Paneli oluşturan admin kullanıcı kimliği (alt bayi sahipliği için) */
  createdByUserId?: string;
  createdByEmail?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminVillaInput = Omit<
  AdminVilla,
  'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'createdByEmail'
>;
