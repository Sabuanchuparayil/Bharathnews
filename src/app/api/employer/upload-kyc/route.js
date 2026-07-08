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

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowed.includes(fileType)) {
    return NextResponse.json({ error: 'File type not allowed. Use JPEG, PNG, WebP, or PDF.' }, { status: 400 });
  }

  const mimeToExt = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  const ext = mimeToExt[fileType] || 'bin';
  const path = `${auth.uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from('employer-kyc')
    .createSignedUploadUrl(path);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    path: `employer-kyc/${path}`,
    token: data.token,
  });
}
