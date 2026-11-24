import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { Platform } from 'react-native';

export type SoundEffect = 'pop' | 'coin' | 'celebrate' | 'nudge' | 'boop';

const STORAGE_KEY = 'tako_sound_enabled_v1';

const SOUND_ASSETS: Record<SoundEffect, number> = {
  pop: require('../../assets/sounds/pop.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  celebrate: require('../../assets/sounds/celebrate.wav'),
  nudge: require('../../assets/sounds/nudge.wav'),
  boop: require('../../assets/sounds/boop.wav'),
};

let soundEnabled = true;
let loadedPref = false;
const nativePlayers: Partial<Record<SoundEffect, AudioPlayer>> = {};
let webAudioCtx: AudioContext | null = null;

async function ensurePrefLoaded(): Promise<boolean> {
  if (loadedPref) return soundEnabled;
  loadedPref = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === '0') soundEnabled = false;
  } catch {
    // default true
  }
  return soundEnabled;
}

export async function getSoundEnabled(): Promise<boolean> {
  return ensurePrefLoaded();
}

export async function setSoundEnabled(next: boolean): Promise<void> {
  soundEnabled = next;
  loadedPref = true;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // ignore
  }
}

function getWebAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!webAudioCtx) {
    webAudioCtx = new Ctor();
  }
  if (webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

function playWebSound(effect: SoundEffect): void {
  const ctx = getWebAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const scheduleTone = (
    startOffset: number,
    dur: number,
    freq: number,
    freqEnd?: number,
    gainPeak = 0.16
  ) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + startOffset);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + startOffset + dur);
    }
    gain.gain.setValueAtTime(0.0001, now + startOffset);
    gain.gain.linearRampToValueAtTime(gainPeak, now + startOffset + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + dur + 0.02);
  };

  if (effect === 'pop') {
    scheduleTone(0, 0.075, 540, 720, 0.14);
  } else if (effect === 'coin') {
    scheduleTone(0, 0.15, 659.25, undefined, 0.15);
    scheduleTone(0.08, 0.24, 987.77, undefined, 0.16);
  } else if (effect === 'celebrate') {
    scheduleTone(0, 0.18, 523.25, undefined, 0.14);
    scheduleTone(0.08, 0.18, 659.25, undefined, 0.14);
    scheduleTone(0.16, 0.22, 783.99, undefined, 0.15);
    scheduleTone(0.24, 0.36, 1046.5, undefined, 0.17);
  } else if (effect === 'nudge') {
    scheduleTone(0, 0.14, 880, undefined, 0.13);
    scheduleTone(0.09, 0.2, 1318.5, undefined, 0.14);
  } else if (effect === 'boop') {
    scheduleTone(0, 0.09, 440, 660, 0.15);
    scheduleTone(0.065, 0.11, 660, 880, 0.14);
  }
}

export function playSound(effect: SoundEffect): void {
  ensurePrefLoaded()
    .then((enabled) => {
      if (!enabled) return;

      if (Platform.OS === 'web') {
        playWebSound(effect);
        return;
      }

      try {
        let player = nativePlayers[effect];
        if (!player) {
          player = createAudioPlayer(SOUND_ASSETS[effect]);
          nativePlayers[effect] = player;
        }
        player.seekTo(0).catch(() => {});
        player.play();
      } catch {
        // ignore audio errors
      }
    })
    .catch(() => {});
}
