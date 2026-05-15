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

export type PackageTourAncillaryService = {
  id: string;
  label: string;
  icon: string;
  iconKey?: string;
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
    /** Ana sayfa lokasyon widget kartları — key: aktivite lokasyon adı */
    activityLocationImages?: Record<string, string>;
    /** Ana sayfa birincil kategori widget kartları — key: ana kategori id */
    activityMainCategoryImages?: Record<string, string>;
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
    /** Tarayıcı sekmesi ve varsayılan sayfa başlığı */
    siteTitle?: string;
    /** Sekme ikonu; boşsa normal logo (logoUrl) kullanılır */
    faviconUrl?: string;
    logoUrl?: string;
    darkLogoUrl?: string;
    /**
     * Sabit WhatsApp balonu için; wa.me ulusal format (ülke kodu dahil, sadece rakam, örn. 905536882734).
     * Boşsa kod içi varsayılan kullanılır.
     */
    whatsappPhoneDigits?: string;
    /**
     * Sol alttaki arama balonu; tel: ile açılır (ülke kodu dahil, sadece rakam).
     * Boşsa arama butonu gösterilmez.
     */
    callPhoneDigits?: string;
    /** Açık iş hatları: tekne turu, aktivite, villa kiralama */
    enabledSiteProducts?: SiteProductType[];
    slides: {
      id: string;
      imageUrl: string;
      title: string;
      subtitle: string;
      badge?: string;
    }[];
    /** Ana sayfa: hero ve footer sabit; aradaki blokların sırası (id listesi). */
    homePageSectionOrder?: string[];
    /** Ana sayfa aktiviteler widget’ında gösterim sırası (aktivite id listesi). */
    homeActivityOrder?: string[];
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
  /** SMTP e-posta sunucu bilgileri (adminden yönetilir; boşsa .env fallback). */
  emailManagement?: {
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPass?: string;
    smtpFrom?: string;
  };
  /** Bilet / fatura e-posta şablonları */
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
  /** İletişim sayfası için yönetilebilir bilgiler */
  contactManagement?: {
    address?: string;
    phonePrimary?: string;
    phoneSecondary?: string;
    email?: string;
    googleMapsUrl?: string;
  };
  /** Footer ödeme görseli ve alt marka metni */
  footerManagement?: {
    paymentMethodsImageUrl?: string;
    /** TÜRSAB dijital doğrulama bandı — sabit link: https://www.tursab.org.tr/tr/ddsv */
    tursabVerificationImageUrl?: string;
    /** Alt çubuk sağdaki metin (örn. alan adı) */
    footerBrandText?: string;
  };
  packageTourManagement?: {
    ancillaryServices: PackageTourAncillaryService[];
  };
};
