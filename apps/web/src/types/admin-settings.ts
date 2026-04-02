export type DictionaryGroup = 'include' | 'exclude' | 'feature';

/** Sözlük: Lucide ikon anahtarı + ad; grup dahil olanlar / olmayanlar / özellikler */
export type SettingsDictionaryEntry = {
  id: string;
  /** Eski kayıtlar için emoji yedekleri */
  icon: string;
  /** Lucide bileşen adı (örn. Utensils) — dictionary-icon.tsx içindeki anahtarlar */
  iconKey?: string;
  label: string;
  group: DictionaryGroup;
};

export type SettingsTagEntry = {
  id: string;
  name: string;
};

export type SettingsSubCategory = {
  id: string;
  name: string;
  coverImageUrl?: string;
  description?: string;
};

export type SettingsCategory = {
  id: string;
  name: string;
  coverImageUrl?: string;
  description?: string;
  subcategories: SettingsSubCategory[];
};

import type { SiteProductType } from '@/lib/site-product-types';

export type AdminSettings = {
  dictionaries: SettingsDictionaryEntry[];
  tags: SettingsTagEntry[];
  categories: SettingsCategory[];
  /** Admin panel blok yönetimi (villa/aktivite gibi) */
  blockManagement?: {
    /**
     * Villa "Bölge" alanına göre kategori banner görselleri.
     * Key: region (örn. "Yalıkavak"), Value: image URL (örn. /uploads/...)
     */
    villaRegionBanners?: Record<string, string>;
  };
  contracts?: {
    kvkkPolicy: string;
    termsOfUse: string;
    cookiePolicy: string;
    onlineVisitorsClarification: string;
    commercialElectronicConsent: string;
    preInformationForm: string;
    distanceSalesContract: string;
    transactionGuide: string;
    privacyAgreement: string;
    explicitConsentText: string;
    deliveryAndReturnTerms: string;
  };
  siteManagement?: {
    logoUrl?: string;
    darkLogoUrl?: string;
    /** Açık iş hatları: tekne turu, aktivite, villa kiralama */
    enabledSiteProducts?: SiteProductType[];
    slides: {
      id: string;
      imageUrl: string;
      title: string;
      subtitle: string;
      badge?: string;
    }[];
  };
  bannerManagement?: {
    sliderBanners: {
      id: string;
      imageUrl: string;
      title: string;
      subtitle: string;
      ctaText?: string;
    }[];
    rightBanner?: {
      imageUrl?: string;
      title?: string;
      subtitle?: string;
      storeBadges?: {
        googlePlayUrl?: string;
        appStoreUrl?: string;
      };
    };
  };
  paymentManagement?: {
    creditCardEnabled: boolean;
    transferEnabled: boolean;
    askSellEnabled?: boolean;
    transferBankName?: string;
    transferAccountHolder?: string;
    transferIban?: string;
    transferBranch?: string;
    transferDescription?: string;
  };
  /** Bilet / fatura e-posta şablonları (SMTP bilgisi .env ile) */
  mailManagement?: {
    ticketEmailEnabled: boolean;
    ticketEmailSubject: string;
    ticketEmailBody: string;
    invoiceEmailEnabled: boolean;
    invoiceEmailSubject: string;
    invoiceEmailBody: string;
  };
  /** Footer sosyal bağlantıları */
  socialMedia?: {
    instagramUrl?: string;
    facebookUrl?: string;
    googleUrl?: string;
    youtubeUrl?: string;
  };
  /** Footer ödeme görseli ve alt marka metni */
  footerManagement?: {
    paymentMethodsImageUrl?: string;
    /** Alt çubuk sağdaki metin (örn. alan adı) */
    footerBrandText?: string;
  };
};
