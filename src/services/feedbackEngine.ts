import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { useRoomStore } from '../store/roomStore';

export type SoundEvent =
  | 'pay_coin'
  | 'friend_join_blub'
  | 'item_add_whoosh'
  | 'settled_chime';

export type HapticEvent = 'tick' | 'success' | 'warning';

let audioCtx: AudioContext | null = null;
let soundBusyUntil = 0;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const Ctx =
    (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
      .AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  startOffsetSec: number,
  durationSec: number,
  gainPeak: number,
  type: OscillatorType = 'sine'
) {
  const now = ctx.currentTime + startOffsetSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), now + durationSec);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

/**
 * Plays a soft, <1s synthesized UI sound.
 * Respects store `soundEnabled` (off by default) and enforces a single-sound mutex.
 */
export function playSound(event: SoundEvent): void {
  const { soundEnabled } = useRoomStore.getState();
  if (!soundEnabled) return;

  const nowMs = Date.now();
  if (nowMs < soundBusyUntil) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  switch (event) {
    case 'pay_coin':
      soundBusyUntil = nowMs + 280;
      playTone(ctx, 1174.66, 1174.66, 0, 0.11, 0.06, 'sine'); // D6
      playTone(ctx, 1567.98, 1567.98, 0.08, 0.18, 0.07, 'sine'); // G6
      break;
    case 'friend_join_blub':
      soundBusyUntil = nowMs + 220;
      playTone(ctx, 320, 560, 0, 0.17, 0.06, 'sine');
      break;
    case 'item_add_whoosh':
      soundBusyUntil = nowMs + 200;
      playTone(ctx, 480, 260, 0, 0.15, 0.04, 'triangle');
      break;
    case 'settled_chime':
      soundBusyUntil = nowMs + 520;
      playTone(ctx, 523.25, 523.25, 0, 0.18, 0.05, 'sine'); // C5
      playTone(ctx, 659.25, 659.25, 0.11, 0.18, 0.05, 'sine'); // E5
      playTone(ctx, 783.99, 783.99, 0.22, 0.28, 0.06, 'sine'); // G5
      break;
  }
}

/**
 * Triggers a light, non-intrusive haptic cue on native devices.
 * Respects `hapticsEnabled` and safely no-ops on web/unsupported hardware.
 */
export function triggerHaptic(event: HapticEvent): void {
  const { hapticsEnabled } = useRoomStore.getState();
  if (!hapticsEnabled || Platform.OS === 'web') return;

  try {
    if (event === 'tick') {
      Haptics.selectionAsync().catch(() => {});
    } else if (event === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (event === 'warning') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
  } catch {
    // Graceful no-op when haptics unavailable
  }
}
