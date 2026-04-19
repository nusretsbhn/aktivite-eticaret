import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteWhatsAppFloat } from "@/components/site/site-whatsapp-float";
import { readSettings } from "@/lib/admin-settings-server";
import { normalizeWhatsAppDigits } from "@/lib/whatsapp-digits";
import { SiteAuthProvider } from "@/components/site/site-auth-provider";
import { SiteCookieConsent } from "@/components/site/site-cookie-consent";

import "./globals.css";

/** Admin’den gelen ayarlar DB’de güncellenir; statik önbellekte kalmaması için dinamik render. */
export const dynamic = "force-dynamic";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const METADATA_BASE = new URL("https://banabivillam.com");

const DEFAULT_SITE_TITLE = "Banabivillam";

export async function generateMetadata(): Promise<Metadata> {
  // Favicon: Site Yönetimi “normal logo” (açık zemin). darkLogoUrl burada kullanılmaz.
  let faviconHref = "/favicon.ico";
  let siteTitle = DEFAULT_SITE_TITLE;
  try {
    const settings = await readSettings();
    const lightLogo = settings.siteManagement?.logoUrl?.trim();
    if (lightLogo) {
      faviconHref = lightLogo;
    }
    const brand = (settings.footerManagement?.footerBrandText ?? "").trim();
    if (brand) {
      siteTitle = brand;
    }
  } catch {
    /* varsayılan favicon / başlık */
  }

  return {
    metadataBase: METADATA_BASE,
    title: {
      default: siteTitle,
      template: `${siteTitle} | %s`,
    },
    description: "Banabivillam villa ve aktivite rezervasyon platformu.",
    icons: {
      icon: faviconHref,
      shortcut: faviconHref,
      apple: faviconHref,
    },
    other: {
      referrer: "origin",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let whatsappDigits = "905536882734";
  try {
    const settings = await readSettings();
    const raw = settings.siteManagement?.whatsappPhoneDigits?.trim();
    if (raw) {
      const n = normalizeWhatsAppDigits(raw);
      if (n) whatsappDigits = n;
    }
  } catch {
    /* varsayılan */
  }

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-clip antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip">
        <SiteAuthProvider>
          {children}
          <SiteCookieConsent />
          <SiteWhatsAppFloat phoneDigits={whatsappDigits} />
        </SiteAuthProvider>
      </body>
    </html>
  );
}
