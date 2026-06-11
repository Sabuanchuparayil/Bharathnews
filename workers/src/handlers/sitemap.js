export async function handleSitemap(env) {
  const articlesUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/articles?pageSize=500`;
  const response = await fetch(articlesUrl);
  const data = await response.json();
  const docs = data.documents || [];

  const urls = docs.map(doc => {
    const slug = doc.fields?.slug?.stringValue || '';
    const date = doc.fields?.publishedAt?.timestampValue || new Date().toISOString();
    return `<url><loc>https://thebharathnews.com/article/${slug}</loc><lastmod>${date.split('T')[0]}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`;
  });

  const staticPages = ['', 'india', 'gcc', 'business', 'technology', 'videos', 'community']
    .map(p => `<url><loc>https://thebharathnews.com/${p}</loc><changefreq>hourly</changefreq><priority>1.0</priority></url>`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.join('\n')}
${urls.join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' },
  });
}
