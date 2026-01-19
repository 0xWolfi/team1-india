import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '192px',
          height: '192px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #000000 0%, #1a1a2e 100%)',
          borderRadius: '24px',
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
              fontSize: '72px',
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: '-2px',
            }}
          >
            T1
          </span>
          <span
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#818cf8',
              fontFamily: 'system-ui, sans-serif',
              marginTop: '-8px',
            }}
          >
            INDIA
          </span>
        </div>
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
