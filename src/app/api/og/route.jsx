import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const PLAYFAIR_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff';
const MANJARI_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/manjari/files/manjari-malayalam-400-normal.woff';

function clean(value, max) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, max);
}

async function loadFont(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const title = clean(searchParams.get('title'), 140) || 'The Bharath News';
  const category = clean(searchParams.get('cat'), 40) || 'News';
  const lang = searchParams.get('lang') === 'ml' ? 'ml' : 'en';
  const fontData = await loadFont(lang === 'ml' ? MANJARI_URL : PLAYFAIR_URL);
  const fontName = lang === 'ml' ? 'Manjari' : 'Playfair';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          background: 'linear-gradient(145deg, #0D7377 0%, #1A1A2E 70%)',
          color: '#FAFAF7',
          fontFamily: fontData ? fontName : 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: 28 }}>
          <div
            style={{
              display: 'flex',
              background: '#E8A838',
              color: '#1C1917',
              borderRadius: 999,
              padding: '8px 18px',
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            {category}
          </div>
          <div style={{ display: 'flex', opacity: 0.85 }}>The Bharath News</div>
        </div>
        <div style={{ display: 'flex', fontSize: lang === 'ml' ? 54 : 62, fontWeight: 700, lineHeight: 1.15 }}>
          {title}
        </div>
        <div style={{ display: 'flex', fontSize: 24, color: '#E8A838' }}>
          Your window to India from the Gulf
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fontData
        ? [{ name: fontName, data: fontData, weight: lang === 'ml' ? 400 : 700, style: 'normal' }]
        : undefined,
    },
  );
}
