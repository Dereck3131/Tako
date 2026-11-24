'use client';

import { Accordion } from '@base-ui/react/accordion';
import { ChevronDown } from 'lucide-react';
import React from 'react';

import { ReceiptLineHeader } from './ReceiptThread';

interface FaqItem {
  id: string;
  code: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'account',
    code: 'Q1',
    question: 'Do I need an account to use it?',
    answer:
      'No. You can tap "Continue as guest" and start splitting bills right away. Whenever you want to keep your splits across devices, you can create an account with your email.',
  },
  {
    id: 'join',
    code: 'Q2',
    question: 'How do friends join a split?',
    answer:
      'Every split creates a scannable QR code and a short TAKO- invite code. Show the QR on your phone or send the code in your group chat so friends can scan or type it in and claim their share.',
  },
  {
    id: 'offline',
    code: 'Q3',
    question: 'Does splitting work without internet?',
    answer:
      'Yes — the split calculation still works when you have no signal, so you can figure out everyone’s share right at the table.',
  },
  {
    id: 'safety',
    code: 'Q4',
    question: 'Is my data safe?',
    // TODO: Replace with link to your published privacy policy and exact data retention details
    answer:
      'Your splits are stored with row-level access controls so only members of a split can view or update it, and Tako does not connect to your bank or e-wallet.',
  },
  {
    id: 'phones',
    code: 'Q5',
    question: 'Which phones are supported?',
    answer:
      'Tako is available now for Android (8.0+) as a direct APK download. An iOS version is coming soon.',
  },
];

/**
 * Section 6 — Centered single-column FAQ (max-w-[760px]).
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="bg-[var(--bg)] py-20 sm:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <ReceiptLineHeader code="05" label="Fine print" amount="5 questions" />

        <div className="mt-8 text-center">
          <h2
            id="faq-heading"
            className="font-[family-name:var(--font-display)] text-[clamp(2rem,4.4vw,3.2rem)] font-black leading-[1.04] tracking-[-0.03em] text-[var(--ink)] text-balance"
          >
            Questions before you split
          </h2>
          <p className="mt-2 font-[family-name:var(--font-hand)] text-2xl font-bold text-[var(--coral-accent)]">
            straight answers lang
          </p>
        </div>

        <Accordion.Root
          multiple={false}
          className="mt-10 divide-y-2 divide-dashed divide-[var(--border)] border-y-2 border-dashed border-[var(--border)]"
        >
          {FAQ_ITEMS.map((item) => (
            <Accordion.Item key={item.id} value={item.id} className="group">
              <Accordion.Header>
                <Accordion.Trigger className="flex min-h-14 w-full items-center justify-between gap-4 py-5 text-left font-[family-name:var(--font-display)] text-base font-extrabold text-[var(--ink)] transition-colors duration-150 hover:text-[var(--cta-bg)] sm:text-lg">
                  <span className="flex items-baseline gap-3.5">
                    <span className="font-mono text-xs font-bold text-[var(--coral-accent)] tabular-nums">
                      {item.code}
                    </span>
                    <span>{item.question}</span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-[var(--mute)] transition-transform duration-200 ease-[var(--ease-out)] group-data-[open]:rotate-180"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="tako-accordion-panel">
                <div className="pb-5 pl-8 pr-6 text-base leading-relaxed text-[var(--mute)]">
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
