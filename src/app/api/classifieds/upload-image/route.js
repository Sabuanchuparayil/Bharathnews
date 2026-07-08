import { NextResponse } from 'next/server';
import { verifyUserRequest } from '@/lib/marketplace-auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  const auth = await verifyUserRequest(request);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const { fileName, fileType } = body;
  if (!fileName || !fileType) {
    return NextResponse.json({ error: 'fileName and fileType required.' }, { status: 400 });
  }

  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(fileType)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images allowed.' }, { status: 400 });
  }

  const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = mimeToExt[fileType] || 'jpg';
  const path = `${auth.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('listing-images')
    .createSignedUploadUrl(path);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/listing-images/${path}`;

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    publicUrl,
    path: `listing-images/${path}`,
    token: data.token,
  });
}
