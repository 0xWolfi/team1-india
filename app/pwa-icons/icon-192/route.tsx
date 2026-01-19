import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

export async function GET() {
  const logoPath = join(process.cwd(), 'public', 't1-logo.png');
  const logoData = readFileSync(logoPath);
  const logoBase64 = logoData.toString('base64');

  return new ImageResponse(
    (
      <div
        style={{
          width: '192px',
          height: '192px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000000',
          borderRadius: '24px',
        }}
      >
        <img
          src={`data:image/png;base64,${logoBase64}`}
          alt="Team1 India"
          style={{
            width: '128px',
            height: '128px',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    {
      width: 192,
      height: 192,
    }
  );
}
