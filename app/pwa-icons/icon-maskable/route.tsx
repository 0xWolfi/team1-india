import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

// Maskable icons need safe zone padding (at least 10% on each side)
// Content should be within the center 80% of the icon
export async function GET() {
  const logoPath = join(process.cwd(), 'public', 't1-logo.png');
  const logoData = readFileSync(logoPath);
  const logoBase64 = logoData.toString('base64');

  return new ImageResponse(
    (
      <div
        style={{
          width: '512px',
          height: '512px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
        }}
      >
        <div
          style={{
            width: '60%',
            height: '60%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={`data:image/png;base64,${logoBase64}`}
            alt="Team1 India"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    ),
    {
      width: 512,
      height: 512,
    }
  );
}
