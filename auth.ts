import NextAuth, { customFetch } from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers';
import { z } from 'zod';
import { intraPhotoPath, profilePhotoUrl } from '@/lib/intra-photo';

const RABAT_CAMPUS_ID = 75;
type FortyTwoProfile = Record<string, unknown>;

const authFetch: typeof fetch = (input, init = {}) => {
  const timeout = AbortSignal.timeout(15_000);
  const signal = init.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
  return fetch(input, { ...init, signal });
};

const profileSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  campus_users: z.array(z.object({ campus_id: z.number().int() })).default([]),
  image: z.unknown().transform(intraPhotoPath).optional(),
});

const provider: OAuthConfig<FortyTwoProfile> = {
  id: '42',
  name: '42 Intra',
  type: 'oauth',
  authorization: {
    url: 'https://api.intra.42.fr/oauth/authorize',
    params: { scope: 'public' },
  },
  token: {
    url: 'https://api.intra.42.fr/oauth/token',
    async conform(response: Response) {
      const contentType = response.headers.get('content-type');
      if (!contentType?.toLowerCase().startsWith('application/json')) {
        const server = response.headers.get('server') ?? 'unknown';
        const ray = response.headers.get('cf-ray') ?? 'none';
        throw new Error(`42 OAuth token response was not JSON (status ${response.status}, content type ${contentType ?? 'missing'}, redirected ${response.redirected}, host ${response.url ? new URL(response.url).host : 'unknown'}, server ${server}, cf-ray ${ray})`);
      }
      return response;
    },
  },
  userinfo: 'https://api.intra.42.fr/v2/me',
  clientId: process.env.FORTYTWO_CLIENT_ID,
  clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  client: { token_endpoint_auth_method: 'client_secret_post' },
  [customFetch]: authFetch,
  checks: ['state'],
  profile(profile) {
    const user = profileSchema.parse(profile);
    return {
      id: String(user.id),
      name: user.login,
      email: null,
      image: user.image ?? null,
      login: user.login,
    };
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [provider],
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: '/', error: '/denied' },
  callbacks: {
    signIn({ profile }) {
      const parsed = profileSchema.safeParse(profile);
      return parsed.success && parsed.data.campus_users.some(({ campus_id }) => campus_id === RABAT_CAMPUS_ID)
        ? true
        : '/denied?reason=rabat';
    },
    jwt({ token, user, account }) {
      if (user && account?.provider === '42') {
        token.fortyTwoId = account.providerAccountId;
        token.login = user.login;
        token.photoPath = typeof user.image === 'string' ? user.image : undefined;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.fortyTwoId);
      session.user.login = String(token.login);
      const userId = Number(token.fortyTwoId);
      session.user.image = Number.isSafeInteger(userId) ? profilePhotoUrl(userId, typeof token.photoPath === 'string' ? token.photoPath : undefined) : null;
      return session;
    },
  },
});
