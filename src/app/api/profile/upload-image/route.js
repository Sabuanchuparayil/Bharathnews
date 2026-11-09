import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/session-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  const auth = await verifyUserRequest(request);
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
    return NextResponse.json({ error: error.message || 'Could not prepare the upload.' }, { status: 500 });
  }

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/article-images/${path}`;
  return NextResponse.json({ uploadUrl: data.signedUrl, publicUrl });
}
