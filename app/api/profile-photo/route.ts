import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { fetchProfilePhoto } from '@/lib/fortytwo-photo';
import { photoContentType, validPhotoSignature, validPhotoPath } from '@/lib/intra-photo';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/** Proxies only the signed-in student’s 42 image without persisting it. */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response(null, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  if (!/^\d+$/.test(session.user.id)) return new Response(null, { status: 401, headers: { 'Cache-Control': 'private, no-store' } });
  const userId = Number(session.user.id);
  const path = request.nextUrl.searchParams.get('p') ?? '';
  const supplied = request.nextUrl.searchParams.get('s') ?? '';
  if (!Number.isSafeInteger(userId) || !validPhotoPath(path) || !validPhotoSignature(userId, path, supplied)) return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
  try {
    const bytes = await fetchProfilePhoto(path);
    const type = bytes && photoContentType(bytes);
    if (!bytes || !type) return new Response(null, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
    return new Response(bytes, { headers: { 'Content-Type': type, 'Content-Length': String(bytes.length), 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('42 profile photo failed:', error instanceof Error ? error.name : 'unknown');
    return new Response(null, { status: 503, headers: { 'Cache-Control': 'private, no-store' } });
  }
}
