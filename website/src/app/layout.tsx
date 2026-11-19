import type { Metadata, Viewport } from 'next';
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google';
import React from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';
import { APK_CONFIG, SITE_CONFIG } from '@/lib/config';

import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAFAF7' },
    { media: '(prefers-color-scheme: dark)', color: '#1B1424' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.siteUrl),
  title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  keywords: [
    'Tako',
    'bill splitting app',
    'barkada bill splitter',
    'QR bill split',
    'Philippines expense splitter',
    'Android APK',
  ],
  authors: [{ name: SITE_CONFIG.author }],
  openGraph: {
    type: 'website',
    siteName: SITE_CONFIG.name,
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
    url: SITE_CONFIG.siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`,
    description: SITE_CONFIG.description,
  },
};

const mobileAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'MobileApplication',
  name: SITE_CONFIG.name,
  operatingSystem: 'ANDROID',
  applicationCategory: 'FinanceApplication',
  softwareVersion: APK_CONFIG.version,
  description: SITE_CONFIG.description,
  url: SITE_CONFIG.siteUrl,
  downloadUrl: APK_CONFIG.url,
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'PHP',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunito.variable} ${jakarta.variable}`}
    >
      <body className="min-h-[100dvh] antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(mobileAppJsonLd) }}
        />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
