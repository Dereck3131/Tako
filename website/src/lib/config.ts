export const SITE_CONFIG = {
  name: 'Tako',
  tagline: 'Split bills, not friendships.',
  secondaryTagline: 'Share a QR. Everyone joins.',
  description:
    'Tako is a friendly bill-splitting app for barkada dinners, roommates, and trips. Split equally, by receipt items, or custom amounts — then share a QR so everyone hops in.',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://tako.app',
  author: 'Frederick',
  links: {
    // TODO: Replace with your real GitHub, Facebook, and privacy policy URLs
    github: 'https://github.com/TODO-your-username',
    facebook: 'https://facebook.com/TODO-your-page',
    privacy: '#privacy-todo',
  },
} as const;

export const APK_CONFIG = {
  // Set NEXT_PUBLIC_APK_URL in Vercel or .env.local to your EAS / direct APK URL
  url:
    process.env.NEXT_PUBLIC_APK_URL ||
    'https://expo.dev/artifacts/eas/TODO-replace-with-tako-apk.apk',
  version: '1.0.0',
  // TODO: Update with exact APK size after running `eas build -p android --profile production`
  sizeLabel: '~28 MB',
  platformLabel: 'Android 8.0+',
} as const;
