'use client';

import { Accordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import React from 'react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'free',
    question: 'Is Tako free?',
    // TODO: Confirm final pricing / monetization plan and update this answer if needed
    answer:
      'Yes — Tako is free to download and use for your splits. (TODO: confirm if any future paid tier or tip jar is planned.)',
  },
  {
    id: 'account',
    question: 'Do I need an account to use it?',
    answer:
      'No. You can tap "Continue as guest" and start splitting bills right away. Whenever you want to keep your splits synced across devices, you can create an account with your email.',
  },
  {
    id: 'join',
    question: 'How do friends join a split?',
    answer:
      'Every split creates a scannable QR code and a short TAKO- invite code. Show the QR on your phone or send the code in your group chat so friends can scan or type it in and claim their share.',
  },
  {
    id: 'safety',
    question: 'Is my data safe?',
    // TODO: Replace with link to your published privacy policy and exact data retention details
    answer:
      'Your splits are stored with row-level access controls so only members of a split can view or update it, and Tako does not connect to your bank or e-wallet. (TODO: add link to final privacy policy.)',
  },
  {
    id: 'phones',
    question: 'Which phones are supported?',
    answer:
      'Tako is available now for Android (8.0+) as a direct APK download. An iOS version is coming soon.',
  },
];

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="border-t border-[var(--border)]/60 py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <h2
          id="faq-heading"
          className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.5vw,3.1rem)] font-black leading-[1.06] tracking-[-0.03em] text-[var(--ink)]"
        >
          Questions before you split
        </h2>

        <Accordion.Root
          multiple={false}
          className="mt-8 divide-y divide-[var(--border)] rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
        >
          {FAQ_ITEMS.map((item) => (
            <Accordion.Item key={item.id} value={item.id} className="group">
              <Accordion.Header>
                <Accordion.Trigger className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left font-[family-name:var(--font-display)] text-base font-extrabold text-[var(--ink)] transition-colors duration-150 hover:text-[var(--cta-bg)] sm:px-6 sm:text-lg">
                  <span>{item.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-[var(--mute)] transition-transform duration-200 ease-[var(--ease-out)] group-data-[open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="tako-accordion-panel">
                <div className="px-5 pb-5 text-base leading-relaxed text-[var(--mute)] sm:px-6">
                  {item.answer}
                </div>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
