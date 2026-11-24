import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';

import { Footer } from '@/components/Footer';
import { SITE_CONFIG } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy — Tako',
  description: 'How Tako handles your account, split data, camera, and privacy.',
};

const SECTIONS = [
  {
    title: '1. Information Tako stores',
    body: 'When you create an account or browse as a guest, Tako stores your display name, email address (if you sign up with email), optional profile photo, and the split rooms, items, member names, payment records, and reminders you create. Data is hosted securely on Supabase with Row Level Security so only members of a split room can view or update that room.',
  },
  {
    title: '2. Payments & financial details',
    body: 'Tako does not process payments, connect to your bank, or collect GCash/Maya credentials. When you settle a split, Tako only saves the payment channel and optional note you choose to record so your group can keep track of who paid.',
  },
  {
    title: '3. Camera & photo library permissions',
    body: 'Tako asks for camera access solely to scan split QR codes, and photo library access only if you choose to upload a profile picture. Nothing from your camera is saved or uploaded without your action.',
  },
  {
    title: '4. Offline storage',
    body: 'Tako caches your recent splits locally on your device so you can view and edit bills offline. Pending changes sync automatically once you are back online.',
  },
  {
    title: '5. Data sharing & deletion',
    body: 'We never sell your personal information or share it with third-party advertisers. You can delete any split room you created directly in the app, remove your profile photo anytime, or contact us via GitHub or Facebook to request full account deletion.',
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex flex-col">
      <header className="border-b border-[var(--border)]/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-xl font-black tracking-tight text-[var(--ink)]"
          >
            tako
          </Link>
          <Link
            href="/"
            className="tako-press inline-flex min-h-10 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-bold text-[var(--ink)]"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--mute)]">
          Privacy Policy
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-black tracking-tight sm:text-4xl">
          Simple bills. Respectful privacy.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--mute)]">
          Last updated: November 24, 2026 · Applies to the {SITE_CONFIG.name} mobile app and website.
        </p>

        <div className="mt-10 space-y-6">
          {SECTIONS.map((sec) => (
            <section
              key={sec.title}
              className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <h2 className="font-[family-name:var(--font-display)] text-lg font-extrabold text-[var(--ink)]">
                {sec.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--mute)] sm:text-base">
                {sec.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--mute)]">
          Questions? Reach out on{' '}
          <a
            href={SITE_CONFIG.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[var(--ink)] underline underline-offset-4"
          >
            GitHub
          </a>{' '}
          or{' '}
          <a
            href={SITE_CONFIG.links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[var(--ink)] underline underline-offset-4"
          >
            Facebook
          </a>
          .
        </p>
      </main>

      <Footer />
    </div>
  );
}
