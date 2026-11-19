import React from 'react';

import { SITE_CONFIG } from '@/lib/config';

export function Footer() {
  return (
    <footer
      className="border-t border-[var(--border)]/70 py-10 text-sm text-[var(--mute)]"
      style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-8">
        <div className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-display)] text-base font-black text-[var(--ink)]">
            tako
          </span>
          <span>·</span>
          <span>Made by {SITE_CONFIG.author}</span>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap items-center gap-6 font-medium">
          <a
            href={SITE_CONFIG.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-[var(--ink)]"
          >
            GitHub
          </a>
          <a
            href={SITE_CONFIG.links.facebook}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150 hover:text-[var(--ink)]"
          >
            Facebook
          </a>
          <a
            href={SITE_CONFIG.links.privacy}
            className="transition-colors duration-150 hover:text-[var(--ink)]"
          >
            Privacy (TODO)
          </a>
        </nav>
      </div>
    </footer>
  );
}
