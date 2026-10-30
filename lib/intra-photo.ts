import { createHmac, timingSafeEqual } from 'node:crypto';

const PHOTO_PATH = /^\/users\/[a-f0-9]{32}\/[A-Za-z0-9_.-]{1,100}\.(?:jpe?g|png|gif|webp)$/i;

/** Accepts only the 42 CDN paths used by profile images. */
export function validPhotoPath(path: unknown): path is string {
  return typeof path === 'string' && PHOTO_PATH.test(path);
}

/** Extracts a safe 42 CDN path from the OAuth profile image object. */
export function intraPhotoPath(image: unknown): string | null {
  if (!image || typeof image !== 'object') return null;
  const { link, versions } = image as { link?: unknown; versions?: unknown };
  const sizes = versions && typeof versions === 'object' ? versions as { large?: unknown; medium?: unknown; small?: unknown; micro?: unknown } : {};
  // `link` is the original image; resized versions are only fallbacks.
  for (const value of [link, sizes.large, sizes.medium, sizes.small, sizes.micro]) {
    if (typeof value !== 'string') continue;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:' && url.hostname === 'cdn.intra.42.fr' && !url.search && validPhotoPath(url.pathname)) return url.pathname;
    } catch {
      // Ignore malformed profile image URLs.
    }
  }
  return null;
}

function signature(userId: number, path: string) {
  return createHmac('sha256', process.env.AUTH_SECRET!).update(`profile-photo:v1:${userId}:${path}`).digest('base64url');
}

/** Creates the local browser URL without exposing the 42 CDN URL. */
export function profilePhotoUrl(userId: number, path: string | null | undefined): string | null {
  if (!validPhotoPath(path) || !process.env.AUTH_SECRET) return null;
  return `/api/profile-photo?p=${encodeURIComponent(path)}&s=${signature(userId, path)}`;
}

/** Verifies that the requested image path was issued by this server. */
export function validPhotoSignature(userId: number, path: string, supplied: string): boolean {
  if (!validPhotoPath(path) || !/^[A-Za-z0-9_-]{43}$/.test(supplied) || !process.env.AUTH_SECRET) return false;
  const expected = Buffer.from(signature(userId, path));
  const received = Buffer.from(supplied);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Detects the real image type before returning CDN bytes to the browser. */
export function photoContentType(bytes: Uint8Array): string | null {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && ascii(1, 4) === 'PNG') return 'image/png';
  if (ascii(0, 4) === 'GIF8') return 'image/gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  return null;
}
