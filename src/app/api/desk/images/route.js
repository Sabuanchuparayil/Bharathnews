import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import { searchImageCatalog } from '@/data/image-catalog';

export async function GET(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get('q') || '').slice(0, 80);
  const category = (searchParams.get('category') || '').slice(0, 40);
  const offset = Number(searchParams.get('offset') || 0) || 0;
  const key = process.env.UNSPLASH_ACCESS_KEY;

  if (key && query.trim()) {
    try {
      const page = Math.floor(Math.max(0, offset) / 8) + 1;
      const url = new URL('https://api.unsplash.com/search/photos');
      url.searchParams.set('query', query.trim());
      url.searchParams.set('per_page', '8');
      url.searchParams.set('page', String(page));
      url.searchParams.set('orientation', 'landscape');
      const res = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
      if (res.ok) {
        const json = await res.json();
        const images = (json.results || []).map(photo => {
          const raw = photo.urls?.raw || photo.urls?.regular || '';
          const sized = raw ? `${raw}${raw.includes('?') ? '&' : '?'}w=800&h=450&fit=crop&editorial=1` : '';
          const name = photo.user?.name || 'Unsplash';
          return {
            url: sized,
            thumb: photo.urls?.small || sized,
            label: photo.alt_description || name,
            credit: `Photo by ${name} on Unsplash`,
          };
        }).filter(item => item.url);
        if (images.length) return NextResponse.json({ source: 'unsplash', images });
      }
    } catch {
      /* fall through to the local catalog */
    }
  }

  return NextResponse.json({
    source: 'catalog',
    images: searchImageCatalog({ query, category, offset }),
  });
}
