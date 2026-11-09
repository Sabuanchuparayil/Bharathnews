import { NextResponse } from 'next/server';
import { verifyEditorialRequest } from '@/lib/editorial-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  const auth = await verifyEditorialRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const fileType = body.fileType;
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(fileType)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
  }

  const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = mimeToExt[fileType] || 'jpg';
  const path = `${auth.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage.from('article-images').createSignedUploadUrl(path);

  if (error) {
    const missing = /bucket/i.test(error.message || '');
    return NextResponse.json({
      error: missing
        ? 'The article-images bucket is missing. Run supabase/migrations/20261109000000_editorial_desk.sql.'
        : error.message,
    }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/article-images/${path}`;
  return NextResponse.json({ uploadUrl: data.signedUrl, publicUrl, token: data.token });
}
