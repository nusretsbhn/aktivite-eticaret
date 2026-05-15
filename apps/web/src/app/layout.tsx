import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteCallFloat } from "@/components/site/site-call-float";
import { SiteWhatsAppFloat } from "@/components/site/site-whatsapp-float";
import { readSettings } from "@/lib/admin-settings-server";
import { getSiteUrl } from "@/lib/site-url";
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

const DEFAULT_SITE_TITLE = "Banabivillam";

export async function generateMetadata(): Promise<Metadata> {
  let siteTitle = DEFAULT_SITE_TITLE;
  try {
    const settings = await readSettings();
    const fromSite = (settings.siteManagement?.siteTitle ?? "").trim();
    const fromFooter = (settings.footerManagement?.footerBrandText ?? "").trim();
    if (fromSite) {
      siteTitle = fromSite;
    } else if (fromFooter) {
      siteTitle = fromFooter;
    }
  } catch {
    /* varsayılan başlık */
  }

  return {
    metadataBase: getSiteUrl(),
    title: {
      default: siteTitle,
      template: `${siteTitle} | %s`,
    },
    description: "Banabivillam villa ve aktivite rezervasyon platformu.",
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
  let callPhoneDigits: string | undefined;
  try {
    const settings = await readSettings();
    const raw = settings.siteManagement?.whatsappPhoneDigits?.trim();
    if (raw) {
      const n = normalizeWhatsAppDigits(raw);
      if (n) whatsappDigits = n;
    }
    const callRaw = settings.siteManagement?.callPhoneDigits?.trim();
    if (callRaw) {
      const n = normalizeWhatsAppDigits(callRaw);
      if (n) callPhoneDigits = n;
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
          <SiteCallFloat phoneDigits={callPhoneDigits} />
          <SiteWhatsAppFloat phoneDigits={whatsappDigits} />
        </SiteAuthProvider>
      </body>
    </html>
  );
}
