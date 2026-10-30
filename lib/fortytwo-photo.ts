import { MAX_PHOTO_BYTES } from './photo-constants';

const API = 'https://api.intra.42.fr';
const CDN = 'https://cdn.intra.42.fr';
let appToken: { value: string; expiresAt: number } | undefined;
let tokenRequest: Promise<string> | undefined;

async function fetchAppToken(): Promise<string> {
  if (appToken && appToken.expiresAt > Date.now() + 60_000) return appToken.value;
  if (tokenRequest) return tokenRequest;
  tokenRequest = (async () => {
    const clientId = process.env.FORTYTWO_CLIENT_ID;
    const clientSecret = process.env.FORTYTWO_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('42 API credentials are not configured');
    const response = await fetch(`${API}/oauth/token`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
      signal: AbortSignal.timeout(15_000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`42 app token request failed (${response.status})`);
    const token = await response.json() as { access_token?: unknown; expires_in?: unknown };
    if (typeof token.access_token !== 'string' || typeof token.expires_in !== 'number') throw new Error('42 app token response was invalid');
    appToken = { value: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
    return token.access_token;
  })();
  try {
    return await tokenRequest;
  } finally {
    tokenRequest = undefined;
  }
}

/** Fetches one profile image from 42 without storing it on the server. */
export async function fetchProfilePhoto(path: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const token = await fetchAppToken();
  const response = await fetch(new URL(path, CDN), {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
    cache: 'no-store',
    redirect: 'error',
  });
  if (!response.ok || Number(response.headers.get('content-length') ?? 0) > MAX_PHOTO_BYTES) return null;
  const bytes = new Uint8Array(await response.arrayBuffer());
  return bytes.length > 0 && bytes.length <= MAX_PHOTO_BYTES ? bytes : null;
}
