export const SITE_CONFIG = {
  name: 'Tako',
  tagline: 'Split bills, not friendships.',
  secondaryTagline: 'Share a QR. Everyone joins.',
  description:
    'Tako is a friendly bill-splitting app for barkada dinners, roommates, and trips. Split equally, by receipt items, or custom amounts — then share a QR so everyone hops in.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://tako.app',
  author: 'Frederick',
  links: {
    github: 'https://github.com/Dereck3131/Tako',
    facebook: 'https://facebook.com/TODO-your-page',
    privacy: '#privacy-todo',
  },
} as const;

export const APK_CONFIG = {
  // Set NEXT_PUBLIC_APK_URL in Vercel or .env.local to override the default GitHub Releases APK URL
  url:
    process.env.NEXT_PUBLIC_APK_URL ||
    'https://github.com/Dereck3131/Tako/releases/download/v1.0.0/tako-v1.0.0.apk',
  version: '1.0.0',
  sizeLabel: '128 MB',
  platformLabel: 'Android 8.0+',
} as const;
