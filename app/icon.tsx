import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  const iconPath = join(process.cwd(), 'app/favicon-source.png');
  const iconData = readFileSync(iconPath);
  const iconBase64 = iconData.toString('base64');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <img
          src={`data:image/png;base64,${iconBase64}`}
          alt="Favicon"
          style={{
            width: '32px',
            height: '32px',
            objectFit: 'contain',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
