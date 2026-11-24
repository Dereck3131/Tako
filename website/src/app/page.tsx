import dynamic from 'next/dynamic';
import React from 'react';

import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { Navbar } from '@/components/Navbar';
import { ReceiptDivider, ScrollTakoTentacle } from '@/components/ReceiptThread';

const ProblemSection = dynamic(() =>
  import('@/components/ProblemSection').then((m) => m.ProblemSection)
);
const HowItWorksSection = dynamic(() =>
  import('@/components/HowItWorksSection').then((m) => m.HowItWorksSection)
);
const FeaturesSection = dynamic(() =>
  import('@/components/FeaturesSection').then((m) => m.FeaturesSection)
);
const BadgesSection = dynamic(() =>
  import('@/components/BadgesSection').then((m) => m.BadgesSection)
);
const ThemeShowcaseSection = dynamic(() =>
  import('@/components/ThemeShowcaseSection').then((m) => m.ThemeShowcaseSection)
);
const FaqSection = dynamic(() =>
  import('@/components/FaqSection').then((m) => m.FaqSection)
);
const FinalCtaSection = dynamic(() =>
  import('@/components/FinalCtaSection').then((m) => m.FinalCtaSection)
);

export default function HomePage() {
  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--ink)]">
      <Navbar />
      <ScrollTakoTentacle />
      <main>
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <ReceiptDivider topClass="bg-[var(--bg)]" fillColor="var(--cream-block)" />
        <FeaturesSection />
        <ReceiptDivider topClass="bg-[var(--cream-block)]" fillColor="var(--bg)" />
        <BadgesSection />
        <ThemeShowcaseSection />
        <FaqSection />
        <ReceiptDivider topClass="bg-[var(--bg)]" fillColor="#150C20" />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
