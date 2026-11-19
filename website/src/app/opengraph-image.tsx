import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Tako — Split bills, not friendships.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '64px 76px',
          background: 'linear-gradient(135deg, #1B1424 0%, #2B1B3D 60%, #44213F 100%)',
          color: '#FFF6EE',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 680 }}>
          <div
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#FF7A8A',
              marginBottom: 20,
            }}
          >
            tako
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: '-0.03em',
            }}
          >
            Split bills, not friendships.
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#C7B8DB',
              marginTop: 24,
              lineHeight: 1.4,
            }}
          >
            Share a QR. Everyone joins. Built for barkada dinners, roommates, and trips.
          </div>
        </div>

        {/* Tako mascot emblem */}
        <div
          style={{
            width: 240,
            height: 240,
            borderRadius: 64,
            background: '#241B30',
            border: '3px solid #3A2C4D',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="168" height="168" viewBox="0 0 64 64" fill="none">
            <path
              d="M12 32C12 19.85 20.95 10 32 10C43.05 10 52 19.85 52 32V45C52 48.5 49 51 45.8 51C42.8 51 40.5 48.8 40.5 46C40.5 48.8 38.3 51 35.3 51C32.8 51 30.8 49.2 30.8 46.8C30.8 49.2 28.8 51 26.3 51C23.3 51 21.1 48.8 21.1 46C21.1 48.8 18.8 51 15.8 51C12.8 51 12 48.5 12 45V32Z"
              fill="#FF7A8A"
            />
            <ellipse cx="24" cy="30" rx="4.2" ry="4.6" fill="#FFF6EE" />
            <ellipse cx="40" cy="30" rx="4.2" ry="4.6" fill="#FFF6EE" />
            <circle cx="24.8" cy="30.2" r="2.3" fill="#2B1B3D" />
            <circle cx="40.8" cy="30.2" r="2.3" fill="#2B1B3D" />
            <path
              d="M27.5 38C29.5 40.2 34.5 40.2 36.5 38"
              stroke="#2B1B3D"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    ),
    { ...size }
  );
}
