'use client';

import clsx from 'clsx';
import { ArrowUpRight, Bell, Check, Download, QrCode, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import React, { useEffect, useState } from 'react';

import { APK_CONFIG } from '@/lib/config';

type DeviceKind = 'android' | 'ios' | 'desktop';

function detectDevice(): DeviceKind {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'android';
  if (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  ) {
    return 'ios';
  }
  return 'desktop';
}

/**
 * Hero download controls:
 * - 'bar' (default): floating glass pill bar with inline version metadata.
 * - 'inline': left-aligned primary pill + circular QR popover + circular arrow button (MEWVERSE layout).
 */
export function HeroDownloadControls({ variant = 'bar' }: { variant?: 'bar' | 'inline' }) {
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [qrOpen, setQrOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setNotified(true);
    setEmail('');
  };

  if (variant === 'inline') {
    return (
      <div className="relative flex w-full flex-col items-center lg:w-auto lg:items-start">
        <div className="flex w-full items-center justify-center gap-2.5 lg:w-auto lg:flex-wrap lg:justify-start">
          {device === 'ios' ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex h-12 flex-1 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[var(--surface-alt)] px-6 text-sm font-bold text-[var(--mute)] opacity-75 lg:flex-initial"
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              <span>iOS — Coming soon</span>
            </button>
          ) : (
            <a
              href={APK_CONFIG.url}
              download
              className="tako-press inline-flex h-12 flex-1 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--cta-bg)] px-6 text-sm font-bold text-white shadow-[0_12px_28px_-8px_rgba(229,64,94,0.58)] transition-transform hover:brightness-105 lg:flex-initial"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download for Android</span>
            </a>
          )}

          {/* Circular arrow action (See how it works) */}
          <a
            href="#how-it-works"
            aria-label="See how Tako works"
            className="tako-press inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--cta-bg)] text-white shadow-[0_12px_28px_-8px_rgba(229,64,94,0.48)] transition-transform hover:brightness-105"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>

          {/* Desktop QR popover button (hidden on phones) */}
          {device === 'desktop' && (
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setQrOpen(true)}
              onMouseLeave={() => setQrOpen(false)}
            >
              <button
                type="button"
                onClick={() => setQrOpen((v) => !v)}
                aria-expanded={qrOpen}
                aria-controls="hero-qr-popover"
                aria-label="Scan QR code to download on Android"
                className="tako-press inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#2B1B3D]/14 bg-white/85 text-[var(--ink)] shadow-[0_8px_20px_-8px_rgba(43,27,61,0.16)] backdrop-blur-md transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/18"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
              </button>

              <div
                id="hero-qr-popover"
                className={clsx(
                  'absolute bottom-full left-0 z-40 mb-3 w-[236px] origin-bottom-left rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left shadow-2xl transition-[transform,opacity] duration-200 ease-[var(--ease-out)]',
                  qrOpen
                    ? 'pointer-events-auto scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-white p-1.5">
                    <QRCodeSVG
                      value={APK_CONFIG.url}
                      size={72}
                      bgColor="#FFFFFF"
                      fgColor="#2B1B3D"
                      level="M"
                      title={`QR code to download Tako Android APK (${APK_CONFIG.url})`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-display)] text-xs font-black text-[var(--ink)]">
                      Scan on Android
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--mute)]">
                      Direct APK · v{APK_CONFIG.version}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* iOS Notify-Me UI (UI only, no backend) */}
        {device === 'ios' && (
          <div className="mt-3 w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3 text-left backdrop-blur-md">
            {notified ? (
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--coral-accent)]">
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Got it — we&apos;ll ping you when Tako for iOS is ready.</span>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com for iOS updates"
                  autoComplete="email"
                  enterKeyHint="send"
                  className="min-h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-[var(--mute)]"
                />
                <button
                  type="submit"
                  className="tako-press inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--cta-bg)] px-4 text-sm font-bold text-white"
                >
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                  Notify me
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-[560px] flex-col items-center">
      {/* Floating translucent pill bar */}
      <div className="flex w-full items-center justify-between gap-2 rounded-full border border-[#2B1B3D]/12 bg-white/80 p-1.5 pl-2 shadow-[0_16px_44px_-12px_rgba(43,27,61,0.18)] backdrop-blur-xl dark:border-white/14 dark:bg-[#17111F]/78 dark:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.75)]">
        <div className="flex min-w-0 items-center gap-3">
          {device === 'ios' ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-full bg-[var(--surface-alt)] px-5 text-sm font-bold text-[var(--mute)] opacity-75"
            >
              <Smartphone className="h-4 w-4" aria-hidden="true" />
              <span>iOS — Coming soon</span>
            </button>
          ) : (
            <a
              href={APK_CONFIG.url}
              download
              className="tako-press inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--cta-bg)] px-5 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(229,64,94,0.55)] sm:px-6"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>Download for Android</span>
            </a>
          )}

          <span className="hidden truncate text-xs font-medium text-[var(--mute)] tabular-nums sm:inline">
            v{APK_CONFIG.version} · {APK_CONFIG.sizeLabel} · {APK_CONFIG.platformLabel}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Desktop QR popover button (hidden on phones) */}
          {device === 'desktop' && (
            <div
              className="relative hidden md:block"
              onMouseEnter={() => setQrOpen(true)}
              onMouseLeave={() => setQrOpen(false)}
            >
              <button
                type="button"
                onClick={() => setQrOpen((v) => !v)}
                aria-expanded={qrOpen}
                aria-controls="hero-qr-popover"
                aria-label="Scan QR code to download on Android"
                className="tako-press inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2B1B3D]/10 bg-[#2B1B3D]/5 text-[var(--ink)] transition-colors hover:bg-[#2B1B3D]/10 dark:border-white/12 dark:bg-white/8 dark:hover:bg-white/15"
              >
                <QrCode className="h-4 w-4" aria-hidden="true" />
              </button>

              <div
                id="hero-qr-popover"
                className={clsx(
                  'absolute bottom-full right-0 z-40 mb-3 w-[230px] origin-bottom-right rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-left shadow-2xl transition-[transform,opacity] duration-200 ease-[var(--ease-out)]',
                  qrOpen
                    ? 'pointer-events-auto scale-100 opacity-100'
                    : 'pointer-events-none scale-95 opacity-0'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="shrink-0 rounded-xl bg-white p-1.5">
                    <QRCodeSVG
                      value={APK_CONFIG.url}
                      size={72}
                      bgColor="#FFFFFF"
                      fgColor="#2B1B3D"
                      level="M"
                      title={`QR code to download Tako Android APK (${APK_CONFIG.url})`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-display)] text-xs font-black text-[var(--ink)]">
                      Scan on Android
                    </p>
                    <p className="mt-0.5 text-[11px] leading-snug text-[var(--mute)]">
                      Direct APK · v{APK_CONFIG.version}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Circular arrow action (See how it works) matching Duckie's right circle button */}
          <a
            href="#how-it-works"
            aria-label="See how Tako works"
            className="tako-press inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2B1B3D]/10 bg-[#2B1B3D]/8 text-[var(--ink)] transition-colors hover:bg-[#2B1B3D]/14 dark:border-white/15 dark:bg-white/12 dark:hover:bg-white/20"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Compact mobile metadata line */}
      <p className="mt-2.5 text-xs font-medium text-[var(--mute)] tabular-nums sm:hidden">
        v{APK_CONFIG.version} · {APK_CONFIG.sizeLabel} · {APK_CONFIG.platformLabel}
      </p>

      {/* iOS Notify-Me UI (UI only, no backend) */}
      {device === 'ios' && (
        <div className="mt-3 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-3 text-left backdrop-blur-md">
          {notified ? (
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--coral-accent)]">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Got it — we&apos;ll ping you when Tako for iOS is ready.</span>
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com for iOS updates"
                autoComplete="email"
                enterKeyHint="send"
                className="min-h-11 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-alt)] px-3.5 text-base text-[var(--ink)] outline-none placeholder:text-[var(--mute)]"
              />
              <button
                type="submit"
                className="tako-press inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--cta-bg)] px-4 text-sm font-bold text-white"
              >
                <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                Notify me
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
