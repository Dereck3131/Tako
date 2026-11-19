'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

import {
  ENTRANCE_VARIANTS,
  type EntranceSpeed,
  type EntranceVariantId,
} from './types';

interface HeroEntrancePickerProps {
  activeId: EntranceVariantId;
  speed: EntranceSpeed;
  measuredSec: number | null;
  onSelect: (id: EntranceVariantId) => void;
  onReplay: () => void;
  onSpeedChange: (speed: EntranceSpeed) => void;
}

const SPEEDS: EntranceSpeed[] = [0.5, 1, 2];

/**
 * Dev-only floating prototype picker following `.agents/skills/prototype/PICKER.md` verbatim.
 * Renders only when `NODE_ENV !== 'production'` or `?proto=1` is present in the URL.
 */
export function HeroEntrancePicker({
  activeId,
  speed,
  measuredSec,
  onSelect,
  onReplay,
  onSpeedChange,
}: HeroEntrancePickerProps) {
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const isDev = process.env.NODE_ENV !== 'production';
    const hasParam =
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('proto') === '1';
    setVisible(isDev || hasParam);
  }, []);

  const activeIdx = Math.max(
    0,
    ENTRANCE_VARIANTS.findIndex((v) => v.id === activeId)
  );
  const activeMeta = ENTRANCE_VARIANTS[activeIdx] ?? ENTRANCE_VARIANTS[0];

  // Measure and slide `.proto-picker-highlight` (exact PICKER.md contract)
  useLayoutEffect(() => {
    if (!visible) return;
    const btn = itemRefs.current[activeIdx];
    const hl = highlightRef.current;
    if (!btn || !hl) return;
    hl.style.width = `${btn.offsetWidth}px`;
    hl.style.transform = `translateX(${btn.offsetLeft}px)`;
    if (!ready) {
      const id = requestAnimationFrame(() => setReady(true));
      return () => cancelAnimationFrame(id);
    }
  }, [activeIdx, visible, ready]);

  // Keyboard shortcuts: 1-4 switch variants, ArrowLeft/Right cycle, R replays
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key >= '1' && e.key <= '4') {
        const idx = Number(e.key) - 1;
        if (ENTRANCE_VARIANTS[idx]) {
          e.preventDefault();
          onSelect(ENTRANCE_VARIANTS[idx].id);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onSelect(ENTRANCE_VARIANTS[(activeIdx + 1) % ENTRANCE_VARIANTS.length].id);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onSelect(
          ENTRANCE_VARIANTS[(activeIdx - 1 + ENTRANCE_VARIANTS.length) % ENTRANCE_VARIANTS.length]
            .id
        );
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onReplay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [visible, activeIdx, onSelect, onReplay]);

  if (!visible) return null;

  const durationLabel =
    measuredSec !== null ? `${measuredSec.toFixed(1)}s` : `${(activeMeta.durationSec / speed).toFixed(1)}s…`;

  return (
    <nav
      ref={pickerRef}
      className="proto-picker"
      data-ready={ready ? '' : undefined}
      aria-label="Hero entrance prototype variants"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <span ref={highlightRef} className="proto-picker-highlight" aria-hidden="true" />

      {ENTRANCE_VARIANTS.map((variant, idx) => {
        const isActive = variant.id === activeId;
        return (
          <button
            key={variant.id}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            type="button"
            className="proto-picker-item"
            data-active={isActive ? '' : undefined}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(variant.id)}
            title={`Variant ${variant.keyLabel}: ${variant.name} (${idx + 1})`}
          >
            {variant.keyLabel} · {variant.name}
          </button>
        );
      })}

      <span className="proto-picker-divider" aria-hidden="true" />

      <button
        type="button"
        className="proto-picker-item proto-picker-replay"
        onClick={onReplay}
        aria-label="Replay entrance animation (R)"
        title="Replay (R)"
      >
        ↻
      </button>

      <span className="proto-picker-divider" aria-hidden="true" />

      {SPEEDS.map((sp) => (
        <button
          key={sp}
          type="button"
          className="proto-picker-item"
          data-active={speed === sp ? '' : undefined}
          onClick={() => onSpeedChange(sp)}
          aria-label={`Playback speed ${sp}x`}
        >
          {sp}x
        </button>
      ))}

      <span className="proto-picker-divider" aria-hidden="true" />
      <span
        className="proto-picker-meta"
        data-measured-sec={measuredSec !== null ? measuredSec.toFixed(2) : ''}
        title="Measured entrance duration"
      >
        {durationLabel}
      </span>
    </nav>
  );
}
