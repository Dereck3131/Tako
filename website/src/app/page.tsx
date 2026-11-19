import React from 'react';

import { FaqSection } from '@/components/FaqSection';
import { FeaturesSection } from '@/components/FeaturesSection';
import { FinalCtaSection } from '@/components/FinalCtaSection';
import { Footer } from '@/components/Footer';
import { HairlineMoment } from '@/components/HairlineMoment';
import { HeroSection } from '@/components/HeroSection';
import { HowItWorksSection } from '@/components/HowItWorksSection';
import { Navbar } from '@/components/Navbar';
import { ProblemSection } from '@/components/ProblemSection';
import { ThemeShowcaseSection } from '@/components/ThemeShowcaseSection';

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--ink)]">
      <Navbar />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <ThemeShowcaseSection />
        <HairlineMoment />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
