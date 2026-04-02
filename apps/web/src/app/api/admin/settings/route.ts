import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readSettings, writeSettings } from '@/lib/admin-settings-server';
import { normalizeEnabledSiteProducts } from '@/lib/site-product-types';
import type {
  AdminSettings,
  DictionaryGroup,
  SettingsCategory,
  SettingsDictionaryEntry,
  SettingsTagEntry,
} from '@/types/admin-settings';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

const GROUPS: DictionaryGroup[] = ['include', 'exclude', 'feature'];

function isDictionaryGroup(x: string): x is DictionaryGroup {
  return GROUPS.includes(x as DictionaryGroup);
}

function validateSettings(body: unknown): AdminSettings | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.dictionaries) || !Array.isArray(b.tags) || !Array.isArray(b.categories)) {
    return null;
  }

  const dictionaries: SettingsDictionaryEntry[] = [];
  for (const row of b.dictionaries) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = String(r.id ?? '').trim();
    const label = String(r.label ?? '').trim();
    const icon = String(r.icon ?? '').trim();
    const iconKeyRaw = String(r.iconKey ?? '').trim();
    const iconKey =
      iconKeyRaw && /^[A-Za-z][A-Za-z0-9]*$/.test(iconKeyRaw) && iconKeyRaw.length <= 48
        ? iconKeyRaw
        : undefined;
    const group = String(r.group ?? '');
    if (!id || !label || !isDictionaryGroup(group)) continue;
    dictionaries.push({
      id,
      icon: icon || '',
      ...(iconKey ? { iconKey } : {}),
      label,
      group,
    });
  }

  const tags: SettingsTagEntry[] = [];
  for (const row of b.tags) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = String(r.id ?? '').trim();
    const name = String(r.name ?? '').trim();
    if (!id || !name) continue;
    tags.push({ id, name });
  }

  const categories: SettingsCategory[] = [];
  for (const row of b.categories) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const id = String(r.id ?? '').trim();
    const name = String(r.name ?? '').trim();
    const coverImageUrl = String(r.coverImageUrl ?? '').trim();
    const description = String(r.description ?? '').trim();
    if (!id || !name) continue;
    const subs: SettingsCategory['subcategories'] = [];
    if (Array.isArray(r.subcategories)) {
      for (const s of r.subcategories) {
        if (!s || typeof s !== 'object') continue;
        const o = s as Record<string, unknown>;
        const sid = String(o.id ?? '').trim();
        const sname = String(o.name ?? '').trim();
        const sCoverImageUrl = String(o.coverImageUrl ?? '').trim();
        const sDescription = String(o.description ?? '').trim();
        if (!sid || !sname) continue;
        subs.push({
          id: sid,
          name: sname,
          ...(sCoverImageUrl ? { coverImageUrl: sCoverImageUrl } : {}),
          ...(sDescription ? { description: sDescription } : {}),
        });
      }
    }
    categories.push({
      id,
      name,
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(description ? { description } : {}),
      subcategories: subs,
    });
  }

  const contractsRaw = b.contracts;
  const contracts =
    contractsRaw && typeof contractsRaw === 'object'
      ? (() => {
          const c = contractsRaw as Record<string, unknown>;
          return {
            kvkkPolicy: String(c.kvkkPolicy ?? '').trim(),
            termsOfUse: String(c.termsOfUse ?? '').trim(),
            cookiePolicy: String(c.cookiePolicy ?? '').trim(),
            onlineVisitorsClarification: String(c.onlineVisitorsClarification ?? '').trim(),
            commercialElectronicConsent: String(c.commercialElectronicConsent ?? '').trim(),
            preInformationForm: String(c.preInformationForm ?? '').trim(),
            distanceSalesContract: String(c.distanceSalesContract ?? '').trim(),
            transactionGuide: String(c.transactionGuide ?? '').trim(),
            privacyAgreement: String(c.privacyAgreement ?? '').trim(),
            explicitConsentText: String(c.explicitConsentText ?? '').trim(),
            deliveryAndReturnTerms: String(c.deliveryAndReturnTerms ?? '').trim(),
          } satisfies NonNullable<AdminSettings['contracts']>;
        })()
      : undefined;

  const sm = b.siteManagement;
  const siteManagement =
    sm && typeof sm === 'object'
      ? (() => {
          const o = sm as Record<string, unknown>;
          const logoUrl = String(o.logoUrl ?? '').trim();
          const darkLogoUrl = String(o.darkLogoUrl ?? '').trim();
          const enabledSiteProducts = normalizeEnabledSiteProducts(o.enabledSiteProducts);
          const slidesRaw = Array.isArray(o.slides) ? o.slides : [];
          const slides = slidesRaw
            .map((s) => {
              if (!s || typeof s !== 'object') return null;
              const r = s as Record<string, unknown>;
              const id = String(r.id ?? '').trim();
              const imageUrl = String(r.imageUrl ?? '').trim();
              const title = String(r.title ?? '').trim();
              const subtitle = String(r.subtitle ?? '').trim();
              const badge = String(r.badge ?? '').trim();
              if (!id || !title) return null;
              return {
                id,
                imageUrl,
                title,
                subtitle,
                ...(badge ? { badge } : {}),
              };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x));
          return {
            ...(logoUrl ? { logoUrl } : {}),
            ...(darkLogoUrl ? { darkLogoUrl } : {}),
            enabledSiteProducts,
            slides,
          } satisfies NonNullable<AdminSettings['siteManagement']>;
        })()
      : undefined;

  const bm = b.bannerManagement;
  const bannerManagement =
    bm && typeof bm === 'object'
      ? (() => {
          const o = bm as Record<string, unknown>;
          const sliderRaw = Array.isArray(o.sliderBanners) ? o.sliderBanners : [];
          const sliderBanners = sliderRaw
            .map((s) => {
              if (!s || typeof s !== 'object') return null;
              const r = s as Record<string, unknown>;
              const id = String(r.id ?? '').trim();
              const imageUrl = String(r.imageUrl ?? '').trim();
              const title = String(r.title ?? '').trim();
              const subtitle = String(r.subtitle ?? '').trim();
              const ctaText = String(r.ctaText ?? '').trim();
              if (!id || !title) return null;
              return { id, imageUrl, title, subtitle, ...(ctaText ? { ctaText } : {}) };
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x));

          const rb = o.rightBanner;
          const rightBanner =
            rb && typeof rb === 'object'
              ? (() => {
                  const r = rb as Record<string, unknown>;
                  const imageUrl = String(r.imageUrl ?? '').trim();
                  const title = String(r.title ?? '').trim();
                  const subtitle = String(r.subtitle ?? '').trim();
                  const sb = r.storeBadges;
                  const storeBadges =
                    sb && typeof sb === 'object'
                      ? (() => {
                          const b = sb as Record<string, unknown>;
                          const googlePlayUrl = String(b.googlePlayUrl ?? '').trim();
                          const appStoreUrl = String(b.appStoreUrl ?? '').trim();
                          return {
                            ...(googlePlayUrl ? { googlePlayUrl } : {}),
                            ...(appStoreUrl ? { appStoreUrl } : {}),
                          };
                        })()
                      : undefined;

                  if (!title && !subtitle && !imageUrl) return null;
                  return {
                    ...(imageUrl ? { imageUrl } : {}),
                    ...(title ? { title } : {}),
                    ...(subtitle ? { subtitle } : {}),
                    ...(storeBadges ? { storeBadges } : {}),
                  };
                })()
              : undefined;

          return { sliderBanners, ...(rightBanner ? { rightBanner } : {}) } satisfies NonNullable<
            AdminSettings['bannerManagement']
          >;
        })()
      : undefined;

  const pm = b.paymentManagement;
  const paymentManagement =
    pm && typeof pm === 'object'
      ? (() => {
          const p = pm as Record<string, unknown>;
          const creditCardEnabled = Boolean(p.creditCardEnabled);
          const transferEnabled = Boolean(p.transferEnabled);
          const askSellEnabled = Boolean(p.askSellEnabled);
          const transferBankName = String(p.transferBankName ?? '').trim();
          const transferAccountHolder = String(p.transferAccountHolder ?? '').trim();
          const transferIban = String(p.transferIban ?? '').trim();
          const transferBranch = String(p.transferBranch ?? '').trim();
          const transferDescription = String(p.transferDescription ?? '').trim();
          return {
            creditCardEnabled,
            transferEnabled,
            askSellEnabled,
            ...(transferBankName ? { transferBankName } : {}),
            ...(transferAccountHolder ? { transferAccountHolder } : {}),
            ...(transferIban ? { transferIban } : {}),
            ...(transferBranch ? { transferBranch } : {}),
            ...(transferDescription ? { transferDescription } : {}),
          } satisfies NonNullable<AdminSettings['paymentManagement']>;
        })()
      : undefined;

  const mailRaw = b.mailManagement;
  const mailManagement =
    mailRaw && typeof mailRaw === 'object'
      ? (() => {
          const m = mailRaw as Record<string, unknown>;
          return {
            ticketEmailEnabled: Boolean(m.ticketEmailEnabled),
            ticketEmailSubject: String(m.ticketEmailSubject ?? '').trim().slice(0, 200),
            ticketEmailBody: String(m.ticketEmailBody ?? '').trim().slice(0, 10000),
            invoiceEmailEnabled: Boolean(m.invoiceEmailEnabled),
            invoiceEmailSubject: String(m.invoiceEmailSubject ?? '').trim().slice(0, 200),
            invoiceEmailBody: String(m.invoiceEmailBody ?? '').trim().slice(0, 10000),
          } satisfies NonNullable<AdminSettings['mailManagement']>;
        })()
      : undefined;

  const smSocial = b.socialMedia;
  const socialMedia =
    smSocial && typeof smSocial === 'object'
      ? (() => {
          const o = smSocial as Record<string, unknown>;
          return {
            instagramUrl: String(o.instagramUrl ?? '').trim().slice(0, 500),
            facebookUrl: String(o.facebookUrl ?? '').trim().slice(0, 500),
            googleUrl: String(o.googleUrl ?? '').trim().slice(0, 500),
            youtubeUrl: String(o.youtubeUrl ?? '').trim().slice(0, 500),
          } satisfies NonNullable<AdminSettings['socialMedia']>;
        })()
      : undefined;

  const fm = b.footerManagement;
  const footerManagement =
    fm && typeof fm === 'object'
      ? (() => {
          const o = fm as Record<string, unknown>;
          return {
            paymentMethodsImageUrl: String(o.paymentMethodsImageUrl ?? '').trim().slice(0, 500),
            footerBrandText: String(o.footerBrandText ?? '').trim().slice(0, 120),
          } satisfies NonNullable<AdminSettings['footerManagement']>;
        })()
      : undefined;

  const blk = b.blockManagement;
  const blockManagement =
    blk && typeof blk === 'object'
      ? (() => {
          const o = blk as Record<string, unknown>;
          const vrb = o.villaRegionBanners;
          const villaRegionBanners: Record<string, string> = {};
          if (vrb && typeof vrb === 'object') {
            for (const [k, v] of Object.entries(vrb as Record<string, unknown>)) {
              const key = String(k ?? '').trim().slice(0, 120);
              const val = String(v ?? '').trim().slice(0, 500);
              if (!key || !val) continue;
              villaRegionBanners[key] = val;
            }
          }
          return {
            ...(Object.keys(villaRegionBanners).length ? { villaRegionBanners } : { villaRegionBanners: {} }),
          } satisfies NonNullable<AdminSettings['blockManagement']>;
        })()
      : undefined;

  return {
    dictionaries,
    tags,
    categories,
    ...(blockManagement ? { blockManagement } : {}),
    ...(contracts ? { contracts } : {}),
    ...(siteManagement ? { siteManagement } : {}),
    ...(bannerManagement ? { bannerManagement } : {}),
    ...(paymentManagement ? { paymentManagement } : {}),
    ...(mailManagement ? { mailManagement } : {}),
    ...(socialMedia ? { socialMedia } : {}),
    ...(footerManagement ? { footerManagement } : {}),
  };
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const settings = await readSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const next = validateSettings(body);
  if (!next) {
    return NextResponse.json({ error: 'Geçersiz ayar verisi' }, { status: 400 });
  }

  const current = await readSettings();
  const merged: AdminSettings = {
    ...current,
    ...next,
    // nested merges to avoid wiping other tabs when patching one tab
    blockManagement: next.blockManagement ?? current.blockManagement,
    siteManagement: next.siteManagement ?? current.siteManagement,
    bannerManagement: next.bannerManagement ?? current.bannerManagement,
    paymentManagement: next.paymentManagement ?? current.paymentManagement,
    mailManagement: next.mailManagement ?? current.mailManagement,
    socialMedia: next.socialMedia ?? current.socialMedia,
    footerManagement: next.footerManagement ?? current.footerManagement,
  };

  await writeSettings(merged);
  return NextResponse.json({ settings: merged });
}
