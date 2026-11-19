'use client';

import clsx from 'clsx';
import { ArrowDown, Bell, Check, Copy, Download, Smartphone } from 'lucide-react';
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

interface DownloadBlockProps {
  variant: 'hero' | 'final';
  surface?: 'default' | 'plum';
}

export function DownloadBlock({ variant, surface = 'default' }: DownloadBlockProps) {
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  const isPlum = surface === 'plum';

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setNotified(true);
    setEmail('');
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(APK_CONFIG.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const primaryBtnClass = isPlum
    ? 'tako-press inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-[var(--coral)] px-7 text-base font-extrabold text-[#2B1B3D] shadow-[0_12px_28px_-10px_rgba(255,122,138,0.45)]'
    : 'tako-press inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-[var(--cta-bg)] px-7 text-base font-bold text-[var(--cta-ink)] shadow-[0_10px_24px_-8px_rgba(217,45,75,0.45)]';

  const secondaryBtnClass = isPlum
    ? 'tako-press inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 text-base font-bold text-[#FFF6EE]'
    : 'tako-press inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 text-base font-bold text-[var(--ink)]';

  const disabledIosBtn = (
    <button
      type="button"
      disabled
      aria-disabled="true"
      className={clsx(
        'inline-flex min-h-13 cursor-not-allowed items-center justify-center gap-2 rounded-full border px-6 text-sm font-bold opacity-65',
        isPlum
          ? 'border-white/20 bg-white/5 text-[#D5C7E8]'
          : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--mute)]'
      )}
    >
      <Smartphone className="h-4 w-4" aria-hidden="true" />
      iOS — Coming soon
    </button>
  );

  return (
    <div className={clsx('w-full', isPlum && 'flex flex-col items-center')}>
      {/* Action buttons row */}
      <div
        className={clsx(
          'flex flex-wrap items-center gap-3',
          isPlum && 'justify-center'
        )}
      >
        {device === 'ios' ? (
          <>
            {disabledIosBtn}
            {variant === 'hero' && (
              <a href="#how-it-works" className={secondaryBtnClass}>
                See how it works
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </>
        ) : (
          <>
            <a href={APK_CONFIG.url} download className={primaryBtnClass}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Download for Android
            </a>
            {variant === 'hero' ? (
              <a href="#how-it-works" className={secondaryBtnClass}>
                See how it works
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : (
              disabledIosBtn
            )}
          </>
        )}
      </div>

      {/* Version & size metadata */}
      <p
        className={clsx(
          'mt-3.5 text-xs font-semibold tabular-nums',
          isPlum ? 'text-[#C7B8DB]' : 'text-[var(--mute)]'
        )}
      >
        v{APK_CONFIG.version} · {APK_CONFIG.sizeLabel} · {APK_CONFIG.platformLabel}
        {device === 'ios' && (
          <>
            {' · '}
            <a
              href={APK_CONFIG.url}
              download
              className="underline underline-offset-4 hover:opacity-80"
            >
              Android APK link
            </a>
          </>
        )}
      </p>

      {/* iOS Notify-Me UI (UI only, no backend) */}
      {device === 'ios' && (
        <div
          className={clsx(
            'mt-5 w-full max-w-md rounded-2xl border p-4 text-left',
            isPlum
              ? 'border-white/15 bg-white/5 text-[#FFF6EE]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]'
          )}
        >
          {notified ? (
            <div className="flex items-center gap-2.5 text-sm font-bold text-[var(--teal)]">
              <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                You&apos;re on the list! We&apos;ll ping you when Tako for iOS is ready.
              </span>
            </div>
          ) : (
            <form onSubmit={handleNotifySubmit} className="space-y-2.5">
              <label
                htmlFor={`ios-notify-${variant}`}
                className={clsx(
                  'block text-xs font-bold',
                  isPlum ? 'text-[#D5C7E8]' : 'text-[var(--mute)]'
                )}
              >
                Want a heads-up when iOS drops?
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  id={`ios-notify-${variant}`}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  autoComplete="email"
                  enterKeyHint="send"
                  className={clsx(
                    'min-h-11 flex-1 rounded-xl border px-3.5 text-base outline-none',
                    isPlum
                      ? 'border-white/20 bg-[#1B1424] text-[#FFF6EE] placeholder:text-[#9B8AB4]'
                      : 'border-[var(--border)] bg-[var(--surface-alt)] text-[var(--ink)] placeholder:text-[var(--mute)]'
                  )}
                />
                <button
                  type="submit"
                  className="tako-press inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[var(--cta-bg)] px-4 text-sm font-bold text-white"
                >
                  <Bell className="h-3.5 w-3.5" aria-hidden="true" />
                  Notify me
                </button>
              </div>
              {/* TODO: Wire this form to a waitlist endpoint when iOS TestFlight opens */}
            </form>
          )}
        </div>
      )}

      {/* Desktop Scannable QR Card — always dark-on-light (#2B1B3D on #FFFFFF) so it scans in both themes */}
      {device === 'desktop' && (
        <div
          className={clsx(
            'mt-6 hidden items-center gap-4 rounded-2xl border p-3.5 text-left md:inline-flex',
            isPlum
              ? 'border-white/15 bg-white/10 text-[#FFF6EE]'
              : 'border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--card-shadow)]'
          )}
        >
          <div className="shrink-0 rounded-xl bg-white p-2.5 shadow-sm">
            <QRCodeSVG
              value={APK_CONFIG.url}
              size={84}
              bgColor="#FFFFFF"
              fgColor="#2B1B3D"
              level="M"
              title={`QR code to download Tako Android APK (${APK_CONFIG.url})`}
            />
          </div>
          <div className="min-w-0 max-w-[230px]">
            <p className="font-[family-name:var(--font-display)] text-sm font-black">
              Scan to download on your phone
            </p>
            <p
              className={clsx(
                'mt-0.5 text-xs leading-snug',
                isPlum ? 'text-[#D5C7E8]' : 'text-[var(--mute)]'
              )}
            >
              Point your Android camera at the code to grab the APK directly.
            </p>
            <button
              type="button"
              onClick={handleCopyUrl}
              className={clsx(
                'tako-press mt-2 inline-flex max-w-full items-center gap-1.5 text-xs font-bold underline underline-offset-4',
                isPlum ? 'text-[#FF7A8A]' : 'text-[var(--cta-bg)]'
              )}
              title={APK_CONFIG.url}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Link copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Copy APK link</span>
                </>
              )}
            </button>
            <span className="sr-only">Download URL: {APK_CONFIG.url}</span>
          </div>
        </div>
      )}
    </div>
  );
}
