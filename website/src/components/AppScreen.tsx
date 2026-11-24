'use client';

import { Clock, QrCode, ReceiptText, Share2, User } from 'lucide-react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import React, { useState } from 'react';

export type AppScreenName =
  | 'splits-home'
  | 'new-split'
  | 'split-ready'
  | 'scan-to-join'
  | 'activity'
  | 'profile';

interface AppScreenProps {
  screen: AppScreenName;
  theme: 'light' | 'dark';
  priority?: boolean;
  alt?: string;
}

const SCREEN_ALTS: Record<AppScreenName, string> = {
  'splits-home': 'Tako app Splits home screen showing active group bills',
  'new-split': 'Tako app New Split screen for entering amount and friends',
  'split-ready': 'Tako app Split Ready screen showing scannable QR code and TAKO-4821 invite code',
  'scan-to-join': 'Tako app Scan to Join QR viewfinder screen',
  activity: 'Tako app Activity feed showing recent splits and settlements',
  profile: 'Tako app Profile screen with theme and account settings',
};

const AVAILABLE_PNG_SCREENS = new Set<AppScreenName>([
  'splits-home',
  'new-split',
  'scan-to-join',
  'activity',
  'profile',
]);

/**
 * Loads the real app screenshot from `/public/screens/{screen}-{theme}.png`.
 * If the PNG hasn't been dropped in yet, renders a faithful live HTML preview of that screen.
 */
export function AppScreen({ screen, theme, priority = false, alt }: AppScreenProps) {
  const [failed, setFailed] = useState(!AVAILABLE_PNG_SCREENS.has(screen));
  const src = `/screens/${screen}-${theme}.png`;

  if (!failed) {
    return (
      <div className="relative h-full w-full overflow-hidden">
        <Image
          src={src}
          alt={alt ?? SCREEN_ALTS[screen]}
          fill
          sizes="(max-width: 768px) 260px, 300px"
          priority={priority}
          draggable={false}
          className="pointer-events-none select-none object-cover object-top"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return <FallbackScreenMock screen={screen} theme={theme} />;
}

function FallbackScreenMock({
  screen,
  theme,
}: {
  screen: AppScreenName;
  theme: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';
  const bg = isDark ? '#1B1424' : '#FAFAF7';
  const surface = isDark ? '#241B30' : '#FFFFFF';
  const surfaceAlt = isDark ? '#2C2139' : '#F3F1E9';
  const ink = isDark ? '#FFF6EE' : '#2B2B2B';
  const mute = isDark ? '#B9ABC9' : '#6A6A6A';
  const border = isDark ? '#3A2C4D' : '#D7D0BE';
  const ctaBg = isDark ? '#E5405E' : '#D92D4B';
  const tealSoft = isDark ? '#19353B' : '#E2F8F5';
  const teal = isDark ? '#2EC4B6' : '#1D9B90';
  const coralSoft = isDark ? '#3D2234' : '#FFE8EC';

  if (screen === 'split-ready') {
    return (
      <div
        className="flex h-full w-full flex-col justify-between p-4 text-center"
        style={{ backgroundColor: '#2B1B3D', color: '#FFF6EE' }}
      >
        <div className="pt-4">
          <div className="text-[11px] font-bold text-[#FFF6EE]">Split ready</div>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full rounded-2xl bg-white p-3.5 text-[#2B1B3D] shadow-md">
            <div className="text-[10px] font-extrabold text-[#6A6A6A]">Ramen Nagi dinner</div>
            <div className="mx-auto my-2.5 inline-flex rounded-xl bg-white p-1.5">
              <QRCodeSVG
                value="tako://join/TAKO-4821"
                size={112}
                bgColor="#FFFFFF"
                fgColor="#2B1B3D"
                level="M"
              />
            </div>
            <div className="mx-auto inline-block rounded-full bg-[#F3F1E9] px-3 py-1 font-[family-name:var(--font-display)] text-xs font-black tracking-wider text-[#2B1B3D]">
              TAKO-4821
            </div>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            <div className="flex">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#2B1B3D] bg-[#FF7A8A] text-[9px] font-black text-[#2B1B3D]">
                Y
              </span>
              <span className="-ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#2B1B3D] bg-[#2EC4B6] text-[9px] font-black text-[#2B1B3D]">
                M
              </span>
            </div>
            <span className="text-[10px] text-[#D5C7E8]">2 joined · waiting for 2 more</span>
          </div>
        </div>

        <div className="space-y-1.5 pb-1">
          <div
            className="flex items-center justify-center gap-1.5 rounded-full py-2 text-[11px] font-extrabold text-white"
            style={{ backgroundColor: ctaBg }}
          >
            <Share2 className="h-3 w-3" />
            Share invite link
          </div>
          <div className="rounded-full border border-white/25 py-1.5 text-[11px] font-bold text-[#FFF6EE]">
            Done
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'scan-to-join') {
    return (
      <div
        className="flex h-full w-full flex-col justify-between p-4 text-left"
        style={{ backgroundColor: '#2B1B3D', color: '#FFF6EE' }}
      >
        <div className="pt-4">
          <div className="text-[11px] font-bold opacity-75">Join a split</div>
          <div className="font-[family-name:var(--font-display)] text-lg font-black leading-tight">
            Scan to join
          </div>
          <p className="mt-0.5 text-[10px] text-[#C7B8DB]">
            Point your camera at a friend&apos;s QR code.
          </p>
        </div>

        <div className="mx-auto my-2 flex h-36 w-36 items-center justify-center rounded-2xl bg-[#3A2850] relative">
          <div className="absolute left-3 top-3 h-4 w-4 rounded-tl border-l-2 border-t-2 border-[#FF7A8A]" />
          <div className="absolute right-3 top-3 h-4 w-4 rounded-tr border-r-2 border-t-2 border-[#FF7A8A]" />
          <div className="absolute bottom-3 left-3 h-4 w-4 rounded-bl border-b-2 border-l-2 border-[#FF7A8A]" />
          <div className="absolute bottom-3 right-3 h-4 w-4 rounded-br border-b-2 border-r-2 border-[#FF7A8A]" />
          <div className="h-0.5 w-24 rounded-full bg-[#FF7A8A]" />
        </div>

        <div className="space-y-2 pb-2">
          <div className="text-[10px] text-[#C7B8DB]">Or enter the code</div>
          <div className="flex items-center gap-1.5 rounded-xl bg-[#3A2850] p-1">
            <div className="flex-1 rounded-lg bg-[#FFF6EE] px-2.5 py-2 font-[family-name:var(--font-display)] text-[11px] font-black tracking-wider text-[#2B1B3D]">
              TAKO-4821
            </div>
            <div
              className="rounded-lg px-3 py-2 text-[11px] font-bold text-white"
              style={{ backgroundColor: ctaBg }}
            >
              Join
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'new-split') {
    return (
      <div
        className="flex h-full w-full flex-col justify-between p-4 text-left"
        style={{ backgroundColor: bg, color: ink }}
      >
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold" style={{ color: mute }}>
              New split
            </span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: mute }}>
              1 / 3
            </span>
          </div>
          <div className="font-[family-name:var(--font-display)] text-base font-black leading-snug">
            What are we splitting?
          </div>
          <div
            className="rounded-xl border p-2.5"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mute }}>
              Split name
            </div>
            <div
              className="mt-1 rounded-lg px-2.5 py-2 text-xs font-bold"
              style={{ backgroundColor: surfaceAlt }}
            >
              Ramen Nagi dinner
            </div>
          </div>
          <div
            className="rounded-xl border p-3 text-center"
            style={{ backgroundColor: surface, borderColor: border }}
          >
            <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: mute }}>
              Total bill
            </div>
            <div className="mt-1 font-[family-name:var(--font-display)] text-2xl font-black tabular-nums">
              <span style={{ color: ctaBg }}>₱</span>2,480
            </div>
            <div className="mt-2 flex justify-center gap-1.5">
              {['Y', 'M', 'K', 'J'].map((letter, idx) => (
                <span
                  key={letter}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black text-[#2B1B3D]"
                  style={{
                    backgroundColor: ['#FF7A8A', '#2EC4B6', '#B9A5E8', '#FFC857'][idx],
                  }}
                >
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-full py-2.5 text-center text-xs font-extrabold text-white"
          style={{ backgroundColor: ctaBg }}
        >
          Continue
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-full flex-col justify-between p-4 text-left"
      style={{ backgroundColor: bg, color: ink }}
    >
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <span className="font-[family-name:var(--font-display)] text-lg font-black tracking-tight">
            tako
          </span>
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black text-[#2B1B3D]"
            style={{ backgroundColor: '#FF7A8A' }}
          >
            F
          </span>
        </div>

        <div
          className="rounded-2xl p-3 text-[#FFF6EE]"
          style={{ backgroundColor: '#2B1B3D' }}
        >
          <div className="text-[10px] text-[#C7B8DB]">Barkada balance</div>
          <div className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-black tabular-nums">
            +₱1,240
          </div>
          <div className="mt-2 flex gap-1.5">
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-bold text-white"
              style={{ backgroundColor: ctaBg }}
            >
              + New split
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold">
              Scan QR
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {[
            { name: 'Ramen Nagi', meta: '4 people · Equal', amt: '₱2,480', pill: 'Owed ₱1,240', good: true },
            { name: 'Samgyup night', meta: '5 people · Items', amt: '₱3,650', pill: 'Settled', good: true },
            { name: 'Grab to BGC', meta: '3 people · Equal', amt: '₱450', pill: 'You owe ₱150', good: false },
          ].map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-xl border px-2.5 py-2"
              style={{ backgroundColor: surface, borderColor: border }}
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-extrabold">{row.name}</div>
                <div className="text-[10px]" style={{ color: mute }}>
                  {row.meta}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-black tabular-nums">{row.amt}</div>
                <span
                  className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                  style={{
                    backgroundColor: row.good ? tealSoft : coralSoft,
                    color: row.good ? teal : ctaBg,
                  }}
                >
                  {row.pill}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom floating pill nav matching Tako's real (tabs)/_layout.tsx */}
      <div
        className="flex items-center justify-between gap-0.5 rounded-full border p-1"
        style={{
          backgroundColor: surface,
          borderColor: border,
          boxShadow: isDark
            ? '0 6px 16px rgba(0, 0, 0, 0.35)'
            : '0 6px 16px rgba(43, 27, 61, 0.08)',
        }}
      >
        {[
          { label: 'Splits', icon: ReceiptText, active: true },
          { label: 'Scan', icon: QrCode, active: false },
          { label: 'Activity', icon: Clock, active: false },
          { label: 'Profile', icon: User, active: false },
        ].map((tab) => {
          const Icon = tab.icon;
          const activeColor = isDark ? '#FF6B84' : '#D92D4B';
          return (
            <div
              key={tab.label}
              className="flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full py-1.5"
              style={{
                backgroundColor: tab.active
                  ? isDark
                    ? surfaceAlt
                    : '#F5E6E8'
                  : 'transparent',
              }}
            >
              <Icon
                className="h-3.5 w-3.5"
                style={{ color: tab.active ? activeColor : ink }}
              />
              <span
                className="text-[8.5px] font-extrabold leading-none"
                style={{ color: tab.active ? activeColor : mute }}
              >
                {tab.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
