import { appDataFile } from '@/lib/next-public-dir';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { DEFAULT_HOME_PAGE_SECTION_ORDER, normalizeHomePageSectionOrder } from '@/lib/home-page-sections';
import { DEFAULT_ENABLED_SITE_PRODUCTS, normalizeEnabledSiteProducts } from '@/lib/site-product-types';
import type { AdminSettings } from '@/types/admin-settings';

const DATA_PATH = appDataFile('admin-settings.json');

export function getDefaultSettings(): AdminSettings {
  return {
    dictionaries: [
      { id: 'ogle', icon: '', iconKey: 'Utensils', label: 'Öğle yemeği', group: 'include' },
      { id: 'transfer', icon: '', iconKey: 'Bus', label: 'Otel transferi', group: 'include' },
      { id: 'rehber', icon: '', iconKey: 'User', label: 'Profesyonel rehber', group: 'include' },
      { id: 'sigorta', icon: '', iconKey: 'Shield', label: 'Seyahat sigortası', group: 'include' },
      { id: 'icecek', icon: '', iconKey: 'GlassWater', label: 'İçecekler', group: 'exclude' },
      { id: 'bahsis', icon: '', iconKey: 'Banknote', label: 'Bahşişler', group: 'exclude' },
      { id: 'kisisel', icon: '', iconKey: 'ShoppingBag', label: 'Kişisel harcamalar', group: 'exclude' },
      { id: 'aile', icon: '', iconKey: 'Users', label: 'Aile dostu', group: 'feature' },
      { id: 'engelli', icon: '', iconKey: 'Accessibility', label: 'Engelli erişimi', group: 'feature' },
      { id: 'wifi', icon: '', iconKey: 'Wifi', label: 'Wi‑Fi', group: 'feature' },
      { id: 'fotograf', icon: '', iconKey: 'Camera', label: 'Fotoğraf dahil', group: 'feature' },
    ],
    tags: [],
    categories: [
      {
        id: 'deniz',
        name: 'Deniz',
        coverImageUrl: '',
        description: '',
        subcategories: [
          { id: 'tekne', name: 'Tekne Turları', coverImageUrl: '', description: '' },
          { id: 'dalis', name: 'Dalış', coverImageUrl: '', description: '' },
        ],
      },
      {
        id: 'kara',
        name: 'Kara',
        coverImageUrl: '',
        description: '',
        subcategories: [
          { id: 'jeep', name: 'Jeep Safari', coverImageUrl: '', description: '' },
          { id: 'yuruyus', name: 'Yürüyüş', coverImageUrl: '', description: '' },
        ],
      },
      {
        id: 'kultur',
        name: 'Kültür',
        coverImageUrl: '',
        description: '',
        subcategories: [
          { id: 'sehir', name: 'Şehir Turları', coverImageUrl: '', description: '' },
          { id: 'muzeler', name: 'Müzeler', coverImageUrl: '', description: '' },
        ],
      },
    ],
    blockManagement: {
      villaRegionBanners: {},
    },
    contracts: {
      kvkkPolicy: '',
      termsOfUse: '',
      cookiePolicy: '',
      onlineVisitorsClarification: '',
      commercialElectronicConsent: '',
      preInformationForm: '',
      distanceSalesContract: '',
      transactionGuide: '',
      privacyAgreement: '',
      explicitConsentText: '',
      deliveryAndReturnTerms: '',
    },
    siteManagement: {
      logoUrl: '',
      darkLogoUrl: '',
      whatsappPhoneDigits: '905536882734',
      enabledSiteProducts: [...DEFAULT_ENABLED_SITE_PRODUCTS],
      slides: [
        {
          id: 'home-1',
          imageUrl: '',
          badge: 'Güvenli ödeme',
          title: 'Sadece Bir Bilet Değil, Ayrıcalık',
          subtitle: 'Günlük turlar ve aktiviteleri kolayca keşfedin.',
        },
      ],
      homePageSectionOrder: [...DEFAULT_HOME_PAGE_SECTION_ORDER],
    },
    bannerManagement: {
      sliderBanners: [],
      rightBanner: {
        imageUrl: '',
        title: 'Uygulamayı hemen indir!',
        subtitle: 'Turları uygulamadan keşfet, hızlı rezervasyon yap, QR biletini kolay takip et.',
        storeBadges: {},
      },
    },
    paymentManagement: {
      creditCardEnabled: false,
      transferEnabled: true,
      askSellEnabled: false,
      transferBankName: '',
      transferAccountHolder: '',
      transferIban: '',
      transferBranch: '',
      transferDescription: '',
    },
    mailManagement: {
      ticketEmailEnabled: true,
      ticketEmailSubject: 'Rezervasyonunuz — Biletiniz ektedir ({{siparisNo}})',
      ticketEmailBody:
        'Merhaba {{adSoyad}},\n\n{{siparisNo}} numaralı rezervasyonunuz için PDF biletiniz ektedir.\n\nTur: {{turAdi}}\nTarih: {{tarih}}\nKalkış: {{kalkis}}\nKişi: {{kisi}}\nTutar: {{tutar}} TL\n\nBilet doğrulama bağlantısı: {{dogrulamaUrl}}\n\nİyi günler dileriz.',
      invoiceEmailEnabled: true,
      invoiceEmailSubject: 'Faturanız — {{siparisNo}}',
      invoiceEmailBody:
        'Merhaba {{adSoyad}},\n\n{{siparisNo}} numaralı siparişiniz için PDF faturanız ektedir.\n\nTur: {{turAdi}}\nTutar: {{tutar}} TL\n\nFaturayı indirmek için: {{faturaUrl}}\n\nİyi günler dileriz.',
    },
    socialMedia: {
      instagramUrl: '',
      facebookUrl: '',
      googleUrl: '',
      youtubeUrl: '',
    },
    footerManagement: {
      paymentMethodsImageUrl: '',
      tursabVerificationImageUrl: '',
      footerBrandText: '12.adalartekneturu.com',
    },
  };
}

export async function readSettings(): Promise<AdminSettings> {
  try {
    const parsed = await readJsonStore<unknown>('admin-settings', () => getDefaultSettings(), DATA_PATH);
    if (!parsed || typeof parsed !== 'object') return getDefaultSettings();
    const s = parsed as Partial<AdminSettings>;
    if (!Array.isArray(s.dictionaries)) return getDefaultSettings();
    if (!Array.isArray(s.tags)) return getDefaultSettings();
    if (!Array.isArray(s.categories)) return getDefaultSettings();
    return {
      dictionaries: s.dictionaries,
      tags: s.tags,
      categories: s.categories,
      blockManagement: (() => {
        const def = getDefaultSettings().blockManagement!;
        const bm = s.blockManagement;
        if (!bm || typeof bm !== 'object') return def;
        const o = bm as Record<string, unknown>;
        const vrb = o.villaRegionBanners;
        const villaRegionBanners: Record<string, string> = {};
        if (vrb && typeof vrb === 'object') {
          for (const [k, v] of Object.entries(vrb as Record<string, unknown>)) {
            const key = String(k ?? '').trim().slice(0, 120);
            const val = String(v ?? '').trim().slice(0, 500);
            if (key && val) villaRegionBanners[key] = val;
          }
        }
        return { ...def, villaRegionBanners };
      })(),
      contracts:
        s.contracts && typeof s.contracts === 'object'
          ? (s.contracts as AdminSettings['contracts'])
          : getDefaultSettings().contracts,
      siteManagement: (() => {
        const def = getDefaultSettings().siteManagement!;
        if (!s.siteManagement || typeof s.siteManagement !== 'object') {
          return def;
        }
        const sm = s.siteManagement as NonNullable<AdminSettings['siteManagement']>;
        return {
          ...def,
          ...sm,
          enabledSiteProducts: normalizeEnabledSiteProducts(sm.enabledSiteProducts),
          slides: Array.isArray(sm.slides) ? sm.slides : def.slides,
          homePageSectionOrder: normalizeHomePageSectionOrder(sm.homePageSectionOrder),
        };
      })(),
      bannerManagement:
        s.bannerManagement && typeof s.bannerManagement === 'object'
          ? (s.bannerManagement as AdminSettings['bannerManagement'])
          : getDefaultSettings().bannerManagement,
      paymentManagement:
        s.paymentManagement && typeof s.paymentManagement === 'object'
          ? {
              ...getDefaultSettings().paymentManagement!,
              ...(s.paymentManagement as Partial<NonNullable<AdminSettings['paymentManagement']>>),
            }
          : getDefaultSettings().paymentManagement,
      mailManagement: {
        ...getDefaultSettings().mailManagement!,
        ...(s.mailManagement && typeof s.mailManagement === 'object'
          ? (s.mailManagement as Partial<NonNullable<AdminSettings['mailManagement']>>)
          : {}),
      },
      socialMedia: {
        ...getDefaultSettings().socialMedia!,
        ...(s.socialMedia && typeof s.socialMedia === 'object'
          ? (s.socialMedia as Partial<NonNullable<AdminSettings['socialMedia']>>)
          : {}),
      },
      footerManagement: {
        ...getDefaultSettings().footerManagement!,
        ...(s.footerManagement && typeof s.footerManagement === 'object'
          ? (s.footerManagement as Partial<NonNullable<AdminSettings['footerManagement']>>)
          : {}),
      },
    };
  } catch {
    return getDefaultSettings();
  }
}

export async function writeSettings(settings: AdminSettings): Promise<void> {
  await writeJsonStore('admin-settings', settings, DATA_PATH);
}
