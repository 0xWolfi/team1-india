import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  // Read the source image
  // Note: We use readFileSync specifically because this runs at build/request time in Node env
  const iconPath = join(process.cwd(), 'app/favicon-source.png');
  const iconData = readFileSync(iconPath);
  const iconBase64 = iconData.toString('base64');

  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          fontSize: 24,
          background: 'transparent',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
         {/* Render the image smaller with padding */}
        <img 
            src={`data:image/png;base64,${iconBase64}`}
            alt="Favicon"
            style={{
                width: '20px', 
                height: '20px',
                objectFit: 'contain'
            }}
        />
      </div>
    ),
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  );
}
