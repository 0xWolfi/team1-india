import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Mobile screenshot (narrow form factor) - 1080x1920 (9:16 aspect ratio)
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1920px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(180deg, #000000 0%, #0f0f23 50%, #1a1a2e 100%)',
          padding: '80px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '60px',
          }}
        >
          <span
            style={{
              fontSize: '180px',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'Kanit, system-ui, sans-serif',
              letterSpacing: '-6px',
            }}
          >
            T1
          </span>
          <span
            style={{
              fontSize: '48px',
              fontWeight: '600',
              color: '#818cf8',
              fontFamily: 'Kanit, system-ui, sans-serif',
              marginTop: '-20px',
            }}
          >
            INDIA
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: '20px',
          }}
        >
          <span
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'Kanit, system-ui, sans-serif',
              lineHeight: 1.2,
            }}
          >
            Built for impact.
          </span>
          <span
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              color: '#818cf8',
              fontFamily: 'Kanit, system-ui, sans-serif',
              lineHeight: 1.2,
            }}
          >
            Designed for builders.
          </span>
        </div>

        {/* Description */}
        <span
          style={{
            fontSize: '32px',
            color: '#94a3b8',
            fontFamily: 'Kanit, system-ui, sans-serif',
            textAlign: 'center',
            marginTop: '60px',
            maxWidth: '800px',
            lineHeight: 1.5,
          }}
        >
          Community of innovators and change-makers building the future together.
        </span>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
    }
  );
}
