'use client';

import clsx from 'clsx';
import { ArrowDown, Bell, Check, Copy, Download, QrCode, Smartphone } from 'lucide-react';
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

export function HeroDownloadControls() {
  const [device, setDevice] = useState<DeviceKind>('desktop');
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    setDevice(detectDevice());
  }, []);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(APK_CONFIG.url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    setNotified(true);
    setEmail('');
  };

  return (
    <div className="w-full">
      {/* Single Primary CTA + Single Secondary Link */}
      <div className="flex flex-wrap items-center gap-3.5">
        {device === 'ios' ? (
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex min-h-13 cursor-not-allowed items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-alt)] px-6 text-base font-bold text-[var(--mute)] opacity-75"
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            iOS — Coming soon
          </button>
        ) : (
          <a
            href={APK_CONFIG.url}
            download
            className="tako-press inline-flex min-h-13 items-center justify-center gap-2.5 rounded-full bg-[var(--cta-bg)] px-7 text-base font-bold text-[var(--cta-ink)] shadow-[0_12px_26px_-8px_rgba(217,45,75,0.48)]"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download for Android
          </a>
        )}

        <a
          href="#how-it-works"
          className="tako-press inline-flex min-h-13 items-center gap-1.5 rounded-full px-3 text-base font-bold text-[var(--ink)] underline-offset-4 hover:underline"
        >
          See how it works
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>

      {/* Metadata + Compact Expandable QR Pill (Desktop) */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {device === 'desktop' && (
          <div
            className="relative hidden md:inline-block"
            onMouseEnter={() => setQrOpen(true)}
            onMouseLeave={() => setQrOpen(false)}
          >
            <button
              type="button"
              onClick={() => setQrOpen((v) => !v)}
              aria-expanded={qrOpen}
              aria-controls="hero-qr-popover"
              className="tako-press inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--ink)] shadow-sm"
            >
              <QrCode className="h-3.5 w-3.5 text-[var(--cta-bg)]" aria-hidden="true" />
              <span>Scan to download</span>
            </button>

            {/* Origin-aware popover expanding cleanly from top-left */}
            <div
              id="hero-qr-popover"
              className={clsx(
                'absolute left-0 top-full z-30 mt-2.5 w-[284px] origin-top-left rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5 shadow-[var(--card-shadow)] transition-[transform,opacity] duration-200 ease-[var(--ease-out)]',
                qrOpen
                  ? 'pointer-events-auto scale-100 opacity-100'
                  : 'pointer-events-none scale-95 opacity-0'
              )}
            >
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 rounded-xl bg-white p-2 shadow-sm">
                  <QRCodeSVG
                    value={APK_CONFIG.url}
                    size={84}
                    bgColor="#FFFFFF"
                    fgColor="#2B1B3D"
                    level="M"
                    title={`QR code to download Tako Android APK (${APK_CONFIG.url})`}
                  />
                </div>
                <div className="min-w-0">
                  <p className="font-[family-name:var(--font-display)] text-sm font-black text-[var(--ink)]">
                    Scan on Android
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-[var(--mute)]">
                    Point your phone camera to grab the APK directly.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="tako-press mt-2 inline-flex items-center gap-1 text-xs font-bold text-[var(--cta-bg)] underline underline-offset-4"
                    title={APK_CONFIG.url}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Link copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Copy APK link</span>
                      </>
                    )}
                  </button>
                  <span className="sr-only">Download URL: {APK_CONFIG.url}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-[var(--mute)] tabular-nums">
          v{APK_CONFIG.version} · {APK_CONFIG.sizeLabel} · {APK_CONFIG.platformLabel}
        </p>
      </div>

      {/* iOS Notify-Me UI (UI only, no backend) */}
      {device === 'ios' && (
        <div className="mt-4 max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
          {notified ? (
            <div className="flex items-center gap-2 text-sm font-bold text-[var(--teal)]">
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
