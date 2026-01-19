import { ImageResponse } from 'next/og';

export const runtime = 'edge';

// Maskable icons need safe zone padding (at least 10% on each side)
// Content should be within the center 80% of the icon
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            // Keep content in safe zone (center 80%)
            width: '80%',
            height: '80%',
          }}
        >
          <span
            style={{
              fontSize: '160px',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '-4px',
            }}
          >
            T1
          </span>
          <span
            style={{
              fontSize: '40px',
              fontWeight: '600',
              color: '#818cf8',
              fontFamily: 'system-ui, sans-serif',
              marginTop: '-16px',
            }}
          >
            INDIA
          </span>
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
