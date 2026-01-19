import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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
          borderRadius: '64px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontSize: '192px',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
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
              fontFamily: 'system-ui, sans-serif',
              marginTop: '-20px',
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
