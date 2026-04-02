import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteAuthProvider } from "@/components/site/site-auth-provider";
import { SiteCookieConsent } from "@/components/site/site-cookie-consent";
import { SiteWhatsAppFloat } from "@/components/site/site-whatsapp-float";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://banabivillam.com'),
  title: {
    default: 'Banabivillam',
    template: 'Banabivillam | %s',
  },
  description: 'Banabivillam villa ve aktivite rezervasyon platformu.',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-x-clip antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip">
        <SiteAuthProvider>
          {children}
          <SiteCookieConsent />
          <SiteWhatsAppFloat />
        </SiteAuthProvider>
      </body>
    </html>
  );
}
