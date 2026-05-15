import { ImageResponse } from 'next/og';

import { loadSiteFavicon } from '@/lib/site-favicon';

export const dynamic = 'force-dynamic';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const asset = await loadSiteFavicon();
  if (asset) {
    return new Response(new Uint8Array(asset.buffer), {
      headers: {
        'Content-Type': asset.contentType,
        'Cache-Control': 'public, max-age=300, must-revalidate',
      },
    });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#2563eb',
          color: 'white',
          fontSize: 72,
          fontWeight: 700,
        }}
      >
        A
      </div>
    ),
    { ...size },
  );
}
