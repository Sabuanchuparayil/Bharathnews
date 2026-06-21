import { GET as feedGet } from '../../feed.xml/route.js';

function socialFeedRequest(request, lang) {
  const url = new URL(request.url);
  url.pathname = '/feed.xml';
  url.searchParams.set('lang', lang);
  url.searchParams.set('limit', '25');
  url.searchParams.set('hours', '24');
  return feedGet(new Request(url.toString(), request));
}

export async function GET(request) {
  return socialFeedRequest(request, 'en');
}
