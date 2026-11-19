import React from 'react';

import { HeroSection } from '@/components/HeroSection';
import { Navbar } from '@/components/Navbar';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--ink)]">
      <Navbar />
      <main>
        <HeroSection />
      </main>
    </div>
  );
}
