'use client';

import { type MotionValue, motion, useReducedMotion, useSpring } from 'motion/react';
import React from 'react';

interface HeroTakoProps {
  /** Normalized cursor/scroll offset (-1 to 1) for subtle eye tracking */
  eyeX: MotionValue<number>;
  eyeY: MotionValue<number>;
  /** Pause idle float/wave/blink when hero is off-screen or browser tab is hidden */
  paused?: boolean;
}

/**
 * Breathing ground shadow rendered on the page background beneath Tako
 * (never on top of the phone screen). Uses composite-only transform + opacity
 * locked to Tako's 4s float cycle.
 */
export function HeroTakoGroundShadow({
  paused = false,
  className = '',
}: {
  paused?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const stopIdle = Boolean(reducedMotion) || paused;

  return (
    <div
      aria-hidden="true"
      style={{
        background:
          'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(28, 16, 44, 0.55) 0%, rgba(28, 16, 44, 0.22) 52%, transparent 78%)',
      }}
      className={`pointer-events-none rounded-full ${stopIdle ? 'opacity-30' : 'tako-idle-shadow'} ${className}`}
    />
  );
}

/**
 * Hero star mascot: renders Tako's exact octopus character from the mobile app
 * directly as an inline SVG. Idle float, blink, and wave run on pure CSS
 * keyframes off the main thread for 0ms TBT.
 */
export function HeroTako({
  eyeX,
  eyeY,
  paused = false,
  className = '',
}: HeroTakoProps & { className?: string }) {
  const reducedMotion = useReducedMotion();
  const stopIdle = Boolean(reducedMotion) || paused;

  const pupilX = useSpring(eyeX, { stiffness: 160, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 160, damping: 20 });

  return (
    <div
      className={`relative h-[170px] w-[170px] sm:h-[260px] sm:w-[260px] lg:h-[420px] lg:w-[420px] xl:h-[468px] xl:w-[468px] select-none ${stopIdle ? '' : 'tako-idle-float'} ${className}`}
      role="img"
      aria-label="Tako the coral octopus holding the phone, a receipt, and a peso coin"
    >
      <svg
        viewBox="-26 -14 186 176"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >

        {/* Left tentacle holding a mini paper receipt */}
        <g transform="translate(-4, 6)">
          <ellipse cx="14" cy="92" rx="12" ry="25" fill="#F0627A" transform="rotate(18 14 92)" />
          <circle cx="10" cy="98" r="3.8" fill="#FFB3BC" />
          <circle cx="6" cy="108" r="3.2" fill="#FFB3BC" />
          {/* Mini receipt held in tentacle */}
          <g transform="translate(-16, 76) rotate(-14)">
            <rect
              x="0"
              y="0"
              width="24"
              height="31"
              rx="4"
              fill="#FFFDF9"
              stroke="#2B1B3D"
              strokeWidth="2.2"
            />
            <path d="M5 8H19M5 14H15M5 20H18" stroke="#2B1B3D" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <circle cx="17" cy="24" r="2.2" fill="#D92D4B" />
          </g>
        </g>

        {/* Inner lower tentacles */}
        <ellipse cx="38" cy="98" rx="12" ry="28" fill="#F0627A" transform="rotate(6 38 98)" />
        <circle cx="37" cy="106" r="4" fill="#FFB3BC" />
        <circle cx="36" cy="117" r="3.5" fill="#FFB3BC" />

        <ellipse cx="64" cy="97" rx="12" ry="29" fill="#F0627A" />
        <circle cx="64" cy="106" r="4" fill="#FFB3BC" />
        <circle cx="64" cy="117" r="3.5" fill="#FFB3BC" />

        {/* Right-inner tentacle holding a gold peso coin */}
        <g>
          <ellipse cx="90" cy="98" rx="12" ry="27" fill="#F0627A" transform="rotate(-10 90 98)" />
          <circle cx="91" cy="106" r="4" fill="#FFB3BC" />
          <circle cx="93" cy="117" r="3.5" fill="#FFB3BC" />
          {/* Gold Peso Coin */}
          <g transform="translate(92, 102) rotate(8)">
            <circle cx="12" cy="12" r="13" fill="#FFC857" stroke="#2B1B3D" strokeWidth="2.2" />
            <circle cx="12" cy="12" r="9.5" stroke="#E09F1F" strokeWidth="1.4" />
            <text
              x="12"
              y="16.5"
              textAnchor="middle"
              fill="#2B1B3D"
              fontSize="13"
              fontWeight="900"
              fontFamily="var(--font-display), sans-serif"
            >
              ₱
            </text>
          </g>
        </g>

        {/* Right tentacle gripping the phone's left frame edge (always visible in front of phone) */}
        <g>
          <path
            d="M98 76 C118 76 134 68 144 58 C151 51 146 40 136 44 C126 48 118 58 96 62 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="136" cy="53" r="3.6" fill="#FFB3BC" />
          <circle cx="124" cy="60" r="3.4" fill="#FFB3BC" />
          <circle cx="112" cy="65" r="3.2" fill="#FFB3BC" />
        </g>

        {/* Main Octopus Head (exact geometry from src/components/TakoMascot.tsx) */}
        <ellipse cx="62" cy="50" rx="52" ry="46" fill="#FF7A8A" />
        <ellipse cx="41" cy="20" rx="13" ry="6" fill="#FF9AA6" />

        {/* Left & Right Eyes with CSS blink + subtle cursor-following pupils */}
        <g
          style={{ transformOrigin: '62px 54px' }}
          className={stopIdle ? undefined : 'tako-idle-blink'}
        >
          {/* Left eye white */}
          <ellipse cx="44" cy="54" rx="12" ry="14" fill="#FFFFFF" />
          {/* Right eye white */}
          <ellipse cx="80" cy="54" rx="12" ry="14" fill="#FFFFFF" />

          {/* Cursor-following pupils */}
          <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
            <ellipse cx="46" cy="57" rx="5.5" ry="7.5" fill="#2B1B3D" />
            <circle cx="47.5" cy="54" r="2.2" fill="#FFFFFF" />
            <ellipse cx="82" cy="57" rx="5.5" ry="7.5" fill="#2B1B3D" />
            <circle cx="83.5" cy="54" r="2.2" fill="#FFFFFF" />
          </motion.g>
        </g>

        {/* Rosy cheeks */}
        <ellipse cx="28" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />
        <ellipse cx="96" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />

        {/* Happy smile */}
        <path
          d="M52 74 Q62 84 72 74"
          fill="none"
          stroke="#2B1B3D"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/**
 * Peeking Tako for the Fan-of-Three-Phones hero:
 * - Head and face sit completely ABOVE the center phone's top bezel (never covering screen content).
 * - Two coral tentacles wrap forward over the top-left and top-right corners of the phone frame.
 * - Small receipt (left) and gold peso coin (right) float beside him as clean props.
 */
export function HeroTakoPeeking({
  eyeX,
  eyeY,
  paused = false,
}: HeroTakoProps) {
  const reducedMotion = useReducedMotion();
  const stopIdle = Boolean(reducedMotion) || paused;

  const pupilX = useSpring(eyeX, { stiffness: 160, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 160, damping: 20 });

  return (
    <div
      className="pointer-events-none relative mx-auto h-[84px] w-[220px] select-none sm:h-[96px] sm:w-[250px]"
      role="img"
      aria-label="Tako peeking over the top of the center phone, gripping its top corners with a receipt and peso coin floating beside him"
    >
      <svg
        viewBox="-45 -10 290 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        {/* Small floating paper receipt prop (left, clear of side phones) */}
        <g className={stopIdle ? undefined : 'tako-orbit-a'}>
          <g transform="translate(-26, 12) rotate(-12)">
            <rect
              x="0"
              y="0"
              width="28"
              height="36"
              rx="4"
              fill="#FFFDF8"
              stroke="#2B1B3D"
              strokeWidth="2.4"
            />
            <path
              d="M6 10H22M6 17H18M6 24H20"
              stroke="#2B1B3D"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.72"
            />
            <circle cx="20" cy="29" r="2.4" fill="#D92D4B" />
          </g>
        </g>

        {/* Small floating gold peso coin prop (right, clear of side phones) */}
        <g className={stopIdle ? undefined : 'tako-orbit-b'}>
          <g transform="translate(194, 16) rotate(10)">
            <circle cx="15" cy="15" r="15" fill="#FFC857" stroke="#2B1B3D" strokeWidth="2.4" />
            <circle cx="15" cy="15" r="11" stroke="#E09F1F" strokeWidth="1.5" />
            <text
              x="15"
              y="20"
              textAnchor="middle"
              fill="#2B1B3D"
              fontSize="15"
              fontWeight="900"
              fontFamily="var(--font-display), sans-serif"
            >
              ₱
            </text>
          </g>
        </g>

        {/* Octopus Head dome sitting fully above the phone top edge */}
        <ellipse cx="100" cy="48" rx="52" ry="44" fill="#FF7A8A" />
        <ellipse cx="79" cy="19" rx="13" ry="6" fill="#FF9AA6" />

        {/* Blinking eyes + cursor-following pupils */}
        <g
          style={{ transformOrigin: '100px 48px' }}
          className={stopIdle ? undefined : 'tako-idle-blink'}
        >
          <ellipse cx="82" cy="48" rx="11.5" ry="13.5" fill="#FFFFFF" />
          <ellipse cx="118" cy="48" rx="11.5" ry="13.5" fill="#FFFFFF" />
          <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
            <ellipse cx="84" cy="50" rx="5.2" ry="7" fill="#2B1B3D" />
            <circle cx="85.5" cy="47.5" r="2" fill="#FFFFFF" />
            <ellipse cx="120" cy="50" rx="5.2" ry="7" fill="#2B1B3D" />
            <circle cx="121.5" cy="47.5" r="2" fill="#FFFFFF" />
          </motion.g>
        </g>

        {/* Rosy cheeks + happy smile */}
        <ellipse cx="66" cy="67" rx="7" ry="4.2" fill="#FF9FAA" />
        <ellipse cx="134" cy="67" rx="7" ry="4.2" fill="#FF9FAA" />
        <path
          d="M90 67 Q100 76 110 67"
          fill="none"
          stroke="#2B1B3D"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Two coral tentacles gripping the phone's top-left and top-right frame corners */}
        <g>
          {/* Left gripping paw */}
          <path
            d="M36 74 C24 74 18 86 24 95 C30 103 44 100 48 90 C50 82 44 74 36 74 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="32" cy="89" r="3" fill="#FFB3BC" />
          <circle cx="40" cy="85" r="2.6" fill="#FFB3BC" />

          {/* Right gripping paw */}
          <path
            d="M164 74 C176 74 182 86 176 95 C170 103 156 100 152 90 C150 82 156 74 164 74 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <circle cx="168" cy="89" r="3" fill="#FFB3BC" />
          <circle cx="160" cy="85" r="2.6" fill="#FFB3BC" />
        </g>
      </svg>
    </div>
  );
}

/**
 * Huge Bottom-Center Hero Tako:
 * - Rises from the bottom receipt edge (only lower tentacles cropped by section edge).
 * - Happy face looking slightly toward the held phone, periodic blink + cursor eye tracking,
 *   slow 1.5% breathing scale (`transform` only).
 * - Outer-left tentacle waves gently while the inner-left tentacle holds the receipt & gold coin.
 * - Raised right tentacle swings up and grips the phone's left frame IN FRONT of the bezel.
 */
export function HeroTakoGiant({
  eyeX,
  eyeY,
  paused = false,
  instant = false,
  isMobile = false,
  phoneSlot,
}: HeroTakoProps & {
  instant?: boolean;
  isMobile?: boolean;
  phoneSlot: React.ReactNode;
}) {
  const reducedMotion = Boolean(useReducedMotion());
  const stopIdle = reducedMotion || paused;

  const pupilX = useSpring(eyeX, { stiffness: 160, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 160, damping: 20 });

  return (
    <div
      className="relative mx-auto flex items-end justify-center select-none"
      role="img"
      aria-label="Giant Tako octopus rising from the bottom edge, holding the Tako Splits phone in his right tentacle and a receipt and peso coin in his left"
    >
      {/* Breathing giant Tako container (viewport-width bounded on mobile so phone never clips; height-scaled on desktop) */}
      <div
        className={`relative h-[74vw] max-h-[290px] w-[86vw] max-w-[336px] sm:h-[clamp(300px,46dvh,470px)] sm:max-h-none sm:w-[clamp(350px,54dvh,560px)] sm:max-w-none lg:h-[clamp(330px,53dvh,550px)] lg:w-[clamp(390px,60dvh,640px)] ${
          stopIdle ? '' : 'tako-breathe'
        }`}
      >
        {/* BACK / MAIN BODY SVG (z-10) */}
        <svg
          viewBox="-40 -10 280 235"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none relative z-10 h-full w-full overflow-visible"
        >
          {/* Outer-left waving tentacle (gentle CSS wave, clear of face & receipt) */}
          <g
            style={{ transformOrigin: '38px 118px' }}
            className={stopIdle ? undefined : 'tako-left-wave'}
          >
            <path
              d="M42 122 C14 116 -4 96 -10 72 C-13 60 -1 54 6 64 C14 78 24 94 46 106 Z"
              fill="#F0627A"
              stroke="#2B1B3D"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="76" r="4" fill="#FFB3BC" />
            <circle cx="10" cy="91" r="4.2" fill="#FFB3BC" />
            <circle cx="24" cy="103" r="4" fill="#FFB3BC" />
          </g>

          {/* Left-inner tentacle holding the mini receipt & gold peso coin (stays steady) */}
          <g>
            <path
              d="M52 128 C34 146 24 176 28 214 C30 226 48 226 52 212 C56 184 62 154 74 134 Z"
              fill="#F0627A"
              stroke="#2B1B3D"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <circle cx="42" cy="166" r="4.4" fill="#FFB3BC" />
            <circle cx="40" cy="186" r="4.2" fill="#FFB3BC" />
            <circle cx="42" cy="204" r="3.8" fill="#FFB3BC" />

            {/* Crisp mini receipt held clear of face */}
            <g transform="translate(-14, 124) rotate(-13)">
              <rect
                x="0"
                y="0"
                width="34"
                height="44"
                rx="4"
                fill="#FFFDF8"
                stroke="#2B1B3D"
                strokeWidth="2.6"
              />
              <path
                d="M7 11H27M7 19H21M7 27H25"
                stroke="#2B1B3D"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.72"
              />
              <circle cx="24" cy="35" r="3" fill="#D92D4B" />
            </g>

            {/* Gold peso coin tucked right beside the receipt */}
            <g transform="translate(18, 152) rotate(10)">
              <circle cx="16" cy="16" r="16" fill="#FFC857" stroke="#2B1B3D" strokeWidth="2.6" />
              <circle cx="16" cy="16" r="11.5" stroke="#E09F1F" strokeWidth="1.6" />
              <text
                x="16"
                y="21.5"
                textAnchor="middle"
                fill="#2B1B3D"
                fontSize="16"
                fontWeight="900"
                fontFamily="var(--font-display), sans-serif"
              >
                ₱
              </text>
            </g>
          </g>

          {/* Lower center tentacles (deliberately extending past bottom hero edge) */}
          <path
            d="M76 132 C70 162 66 196 68 230 L94 230 C96 196 96 164 98 134 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.6"
          />
          <circle cx="82" cy="166" r="4.6" fill="#FFB3BC" />
          <circle cx="80" cy="190" r="4.4" fill="#FFB3BC" />
          <circle cx="80" cy="212" r="4" fill="#FFB3BC" />

          <path
            d="M104 134 C106 164 108 198 106 230 L132 230 C136 196 132 162 126 132 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.6"
          />
          <circle cx="118" cy="166" r="4.6" fill="#FFB3BC" />
          <circle cx="120" cy="190" r="4.4" fill="#FFB3BC" />
          <circle cx="120" cy="212" r="4" fill="#FFB3BC" />

          {/* Lower-right supporting tentacle */}
          <path
            d="M132 128 C144 156 150 190 146 230 L170 230 C174 190 166 150 150 122 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.6"
          />
          <circle cx="152" cy="164" r="4.4" fill="#FFB3BC" />
          <circle cx="156" cy="188" r="4.2" fill="#FFB3BC" />

          {/* Raised right arm base reaching out toward the held phone */}
          <path
            d="M144 106 C166 106 184 96 198 84 L190 104 C174 116 156 122 138 122 Z"
            fill="#F0627A"
            stroke="#2B1B3D"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* Main Octopus Head (centered at x=100, exact Tako proportions) */}
          <ellipse
            cx="100"
            cy="72"
            rx="64"
            ry="56"
            fill="#FF7A8A"
            stroke="#2B1B3D"
            strokeWidth="2.8"
          />
          {/* Specular highlight */}
          <ellipse cx="74" cy="36" rx="16" ry="7.5" fill="#FF9AA6" />

          {/* Eyes: looking slightly right toward the held phone + blink + pointer tracking */}
          <g
            style={{ transformOrigin: '100px 76px' }}
            className={stopIdle ? undefined : 'tako-idle-blink'}
          >
            <ellipse cx="78" cy="76" rx="14.5" ry="17" fill="#FFFFFF" stroke="#2B1B3D" strokeWidth="2.2" />
            <ellipse cx="122" cy="76" rx="14.5" ry="17" fill="#FFFFFF" stroke="#2B1B3D" strokeWidth="2.2" />
            <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
              <ellipse cx="83" cy="78" rx="6.6" ry="9" fill="#2B1B3D" />
              <circle cx="85" cy="74.5" r="2.6" fill="#FFFFFF" />
              <ellipse cx="127" cy="78" rx="6.6" ry="9" fill="#2B1B3D" />
              <circle cx="129" cy="74.5" r="2.6" fill="#FFFFFF" />
            </motion.g>
          </g>

          {/* Rosy cheeks */}
          <ellipse cx="58" cy="99" rx="9" ry="5.5" fill="#FF9FAA" />
          <ellipse cx="142" cy="99" rx="9" ry="5.5" fill="#FF9FAA" />

          {/* Happy smile */}
          <path
            d="M88 99 Q100 112 112 99"
            fill="none"
            stroke="#2B1B3D"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
        </svg>

        {/* HELD PHONE (z-20): ~42% of Tako height, 6deg tilt on desktop, upright on mobile, 100% visible */}
        <motion.div
          initial={instant ? false : { opacity: 0, y: 24, rotate: isMobile ? 0 : 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, rotate: isMobile ? 0 : 6, scale: 1 }}
          transition={
            instant
              ? { duration: 0 }
              : { type: 'spring', duration: 0.65, bounce: 0.22, delay: 0.24 }
          }
          className="absolute right-[2%] top-[6%] z-20 sm:right-[-2%] lg:right-[-2%] lg:top-[8%]"
        >
          <div className={stopIdle ? '' : 'tako-orbit-a'}>
            {phoneSlot}
          </div>

          {/* FRONT GRIPPING TENTACLE (z-30): tapered with sucker dots, drawn IN FRONT of phone's left edge */}
          <svg
            aria-hidden="true"
            width="58"
            height="46"
            viewBox="0 0 58 46"
            fill="none"
            className="pointer-events-none absolute -left-6 top-[48%] z-30 overflow-visible"
          >
            <path
              d="M2 24 C16 14 38 10 50 18 C56 22 52 33 40 34 C26 35 14 32 2 36 Z"
              fill="#F0627A"
              stroke="#2B1B3D"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <circle cx="40" cy="23" r="3.4" fill="#FFB3BC" />
            <circle cx="27" cy="24" r="3.6" fill="#FFB3BC" />
            <circle cx="14" cy="27" r="3.2" fill="#FFB3BC" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Plush 3D-shaded Studio Tako centerpiece:
 * Zero harsh black cartoon outlines — smooth multi-stop radial lighting,
 * glossy forehead specular, warm coral subsurface glow, expressive blinking eyes
 * with cursor-following pupils, and gentle off-main-thread breathing.
 */
export function HeroTakoPlush({
  eyeX,
  eyeY,
  paused = false,
  className = '',
}: HeroTakoProps & { className?: string }) {
  const reducedMotion = Boolean(useReducedMotion());
  const stopIdle = reducedMotion || paused;

  const pupilX = useSpring(eyeX, { stiffness: 150, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 150, damping: 20 });

  return (
    <div
      className={`relative select-none ${stopIdle ? '' : 'tako-breathe'} ${className}`}
      role="img"
      aria-label="Tako the coral octopus smiling warmly"
    >
      <svg
        viewBox="0 0 320 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        <defs>
          {/* Plush 3D head dome gradient (warm top-left key light -> deep coral rim) */}
          <radialGradient id="takoPlushHead" cx="38%" cy="28%" r="70%" fx="34%" fy="22%">
            <stop offset="0%" stopColor="#FFC0C8" />
            <stop offset="32%" stopColor="#FF8897" />
            <stop offset="72%" stopColor="#F05B75" />
            <stop offset="100%" stopColor="#C73554" />
          </radialGradient>

          {/* Soft 3D tentacle body shading */}
          <radialGradient id="takoPlushTentacle" cx="42%" cy="24%" r="76%">
            <stop offset="0%" stopColor="#FF9AA7" />
            <stop offset="45%" stopColor="#EF5C77" />
            <stop offset="100%" stopColor="#B82C4A" />
          </radialGradient>

          {/* Glossy top highlight */}
          <linearGradient id="takoSpecular" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Warm rim light from bottom */}
          <radialGradient id="takoRimGlow" cx="50%" cy="85%" r="55%">
            <stop offset="0%" stopColor="#FFD0D6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FF7A8A" stopOpacity="0" />
          </radialGradient>

          {/* Rosy cheek blush */}
          <radialGradient id="takoCheek" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FF4F70" stopOpacity="0.52" />
            <stop offset="100%" stopColor="#FF7A8A" stopOpacity="0" />
          </radialGradient>

          {/* Happy open mouth interior */}
          <linearGradient id="takoMouth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A172D" />
            <stop offset="100%" stopColor="#8C264A" />
          </linearGradient>
        </defs>

        {/* Plush lower tentacles fanning softly into the hero action bar */}
        <g>
          <ellipse cx="66" cy="236" rx="34" ry="52" fill="url(#takoPlushTentacle)" transform="rotate(24 66 236)" />
          <ellipse cx="116" cy="248" rx="32" ry="54" fill="url(#takoPlushTentacle)" transform="rotate(8 116 248)" />
          <ellipse cx="160" cy="252" rx="33" ry="54" fill="url(#takoPlushTentacle)" />
          <ellipse cx="204" cy="248" rx="32" ry="54" fill="url(#takoPlushTentacle)" transform="rotate(-8 204 248)" />
          <ellipse cx="254" cy="236" rx="34" ry="52" fill="url(#takoPlushTentacle)" transform="rotate(-24 254 236)" />
          {/* Soft pastel sucker dots */}
          <circle cx="62" cy="248" r="7" fill="#FFD1D8" opacity="0.65" />
          <circle cx="114" cy="256" r="7" fill="#FFD1D8" opacity="0.65" />
          <circle cx="160" cy="260" r="7" fill="#FFD1D8" opacity="0.65" />
          <circle cx="206" cy="256" r="7" fill="#FFD1D8" opacity="0.65" />
          <circle cx="258" cy="248" r="7" fill="#FFD1D8" opacity="0.65" />
        </g>

        {/* Main Plush 3D Octopus Head */}
        <ellipse cx="160" cy="134" rx="112" ry="102" fill="url(#takoPlushHead)" />
        {/* Warm bounce light */}
        <ellipse cx="160" cy="144" rx="104" ry="90" fill="url(#takoRimGlow)" />
        {/* Soft glossy forehead specular */}
        <ellipse cx="122" cy="68" rx="40" ry="18" fill="url(#takoSpecular)" transform="rotate(-16 122 68)" />

        {/* Expressive eyebrows */}
        <path
          d="M104 92 Q118 84 132 90"
          stroke="#5C182D"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M188 90 Q202 84 216 92"
          stroke="#5C182D"
          strokeWidth="4.5"
          strokeLinecap="round"
          opacity="0.72"
        />

        {/* Large glossy 3D eyes with periodic blink + cursor-following pupils */}
        <g
          style={{ transformOrigin: '160px 136px' }}
          className={stopIdle ? undefined : 'tako-idle-blink'}
        >
          {/* Left eye */}
          <ellipse cx="118" cy="136" rx="24" ry="29" fill="#1E112B" />
          <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
            <ellipse cx="119" cy="137" rx="17" ry="22" fill="#0E0716" />
            <circle cx="110" cy="124" r="7.5" fill="#FFFFFF" />
            <circle cx="126" cy="147" r="3.4" fill="#FFFFFF" opacity="0.75" />
          </motion.g>

          {/* Right eye */}
          <ellipse cx="202" cy="136" rx="24" ry="29" fill="#1E112B" />
          <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
            <ellipse cx="201" cy="137" rx="17" ry="22" fill="#0E0716" />
            <circle cx="192" cy="124" r="7.5" fill="#FFFFFF" />
            <circle cx="208" cy="147" r="3.4" fill="#FFFFFF" opacity="0.75" />
          </motion.g>
        </g>

        {/* Soft plush rosy cheeks */}
        <ellipse cx="82" cy="170" rx="22" ry="13" fill="url(#takoCheek)" />
        <ellipse cx="238" cy="170" rx="22" ry="13" fill="url(#takoCheek)" />

        {/* Joyful open smile (warm tongue highlight) */}
        <path
          d="M134 170 Q160 176 186 170 Q184 204 160 204 Q136 204 134 170 Z"
          fill="url(#takoMouth)"
        />
        <ellipse cx="160" cy="195" rx="15" ry="7.5" fill="#FF7A8A" opacity="0.88" />
      </svg>
    </div>
  );
}

/**
 * 100% Authentic Tako Mascot (exact geometry & colors from src/components/TakoMascot.tsx):
 * Coral #FF7A8A head, #FF9AA6 highlight oval, #FFFFFF eye whites with #2B1B3D pupils
 * & white catchlights, #FF9FAA rosy cheeks, #2B1B3D smile, and 5 #F0627A tentacles
 * with #FFB3BC sucker dots. No outer black strokes, no altered shading.
 */
export function HeroTakoAuthentic({
  eyeX,
  eyeY,
  paused = false,
  className = '',
}: HeroTakoProps & { className?: string }) {
  const reducedMotion = Boolean(useReducedMotion());
  const stopIdle = reducedMotion || paused;

  const pupilX = useSpring(eyeX, { stiffness: 160, damping: 20 });
  const pupilY = useSpring(eyeY, { stiffness: 160, damping: 20 });

  return (
    <div
      className={`relative select-none ${stopIdle ? '' : 'tako-idle-float'} ${className}`}
      role="img"
      aria-label="Tako the coral octopus smiling and waving"
    >
      <svg
        viewBox="-14 -8 156 146"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
      >
        {/* 5 authentic coral tentacles with pastel sucker dots */}
        <g>
          {/* Tentacle 1 */}
          <ellipse cx="14" cy="94" rx="12" ry="25" fill="#F0627A" transform="rotate(14 14 94)" />
          <circle cx="11" cy="100" r="4" fill="#FFB3BC" />
          <circle cx="9" cy="110" r="3.4" fill="#FFB3BC" />

          {/* Tentacle 2 */}
          <ellipse cx="38" cy="92" rx="12" ry="28" fill="#F0627A" transform="rotate(5 38 92)" />
          <circle cx="37" cy="100" r="4" fill="#FFB3BC" />
          <circle cx="36" cy="112" r="3.5" fill="#FFB3BC" />

          {/* Tentacle 3 */}
          <ellipse cx="62" cy="90" rx="12" ry="30" fill="#F0627A" />
          <circle cx="62" cy="100" r="4" fill="#FFB3BC" />
          <circle cx="62" cy="112" r="3.5" fill="#FFB3BC" />

          {/* Tentacle 4 */}
          <ellipse cx="86" cy="92" rx="12" ry="28" fill="#F0627A" transform="rotate(-5 86 92)" />
          <circle cx="87" cy="100" r="4" fill="#FFB3BC" />
          <circle cx="88" cy="112" r="3.5" fill="#FFB3BC" />

          {/* Tentacle 5 (friendly gentle wave) */}
          <g
            style={{ transformOrigin: '104px 80px' }}
            className={stopIdle ? undefined : 'tako-idle-wave'}
          >
            <ellipse cx="110" cy="88" rx="12" ry="26" fill="#F0627A" transform="rotate(-24 110 88)" />
            <circle cx="114" cy="92" r="4" fill="#FFB3BC" />
            <circle cx="118" cy="102" r="3.4" fill="#FFB3BC" />
          </g>
        </g>

        {/* Main authentic Octopus Head */}
        <ellipse cx="62" cy="50" rx="52" ry="46" fill="#FF7A8A" />
        <ellipse cx="41" cy="20" rx="13" ry="6" fill="#FF9AA6" />

        {/* Authentic Eyes with periodic CSS blink + cursor-following pupils */}
        <g
          style={{ transformOrigin: '62px 54px' }}
          className={stopIdle ? undefined : 'tako-idle-blink'}
        >
          <ellipse cx="44" cy="54" rx="12" ry="14" fill="#FFFFFF" />
          <ellipse cx="80" cy="54" rx="12" ry="14" fill="#FFFFFF" />
          <motion.g style={reducedMotion ? undefined : { x: pupilX, y: pupilY }}>
            <ellipse cx="46" cy="56" rx="5.5" ry="7.5" fill="#2B1B3D" />
            <circle cx="47.5" cy="53" r="2.2" fill="#FFFFFF" />
            <ellipse cx="82" cy="56" rx="5.5" ry="7.5" fill="#2B1B3D" />
            <circle cx="83.5" cy="53" r="2.2" fill="#FFFFFF" />
          </motion.g>
        </g>

        {/* Rosy cheeks */}
        <ellipse cx="28" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />
        <ellipse cx="96" cy="74" rx="7.5" ry="4.5" fill="#FF9FAA" />

        {/* Authentic happy smile */}
        <path
          d="M52 74 Q62 84 72 74"
          fill="none"
          stroke="#2B1B3D"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
