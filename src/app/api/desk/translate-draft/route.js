import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import { prepareEditorialTranslation } from '@/lib/editorial-articles';

export const maxDuration = 60;

function jsonError(err) {
  return NextResponse.json(
    { error: err.hint ? `${err.message} ${err.hint}` : (err.message || 'Request failed.') },
    { status: err.status || 500 },
  );
}

export async function POST(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error || !auth.uid) {
    return NextResponse.json({ error: auth.error || 'Sign in required.' }, { status: auth.status || 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const id = typeof body.id === 'string' && body.id.trim() ? body.id.trim() : null;
  try {
    const result = await prepareEditorialTranslation({
      language: body.language,
      title: body.title,
      summary: body.summary,
      fullContent: body.fullContent,
      skipEnglish: body.skipEnglish === true,
      skipMalayalam: body.skipMalayalam === true,
      force: body.force === true,
      translations: body.translations,
    }, id);
    return NextResponse.json(result);
  } catch (err) {
    return jsonError(err);
  }
}
