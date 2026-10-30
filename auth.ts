import NextAuth from 'next-auth';
import type { OAuthConfig } from 'next-auth/providers';
import { z } from 'zod';

const RABAT_CAMPUS_ID = 75;
type FortyTwoProfile = Record<string, unknown>;

const profileSchema = z.object({
  id: z.number().int().positive(),
  login: z.string().min(1),
  campus_users: z.array(z.object({ campus_id: z.number().int() })).default([]),
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
        throw new Error(`42 OAuth token response was not JSON (status ${response.status})`);
      }
      return response;
    },
  },
  userinfo: 'https://api.intra.42.fr/v2/me',
  clientId: process.env.FORTYTWO_CLIENT_ID,
  clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  client: { token_endpoint_auth_method: 'client_secret_post' },
  checks: ['state'],
  profile(profile) {
    const user = profileSchema.parse(profile);
    return {
      id: String(user.id),
      name: user.login,
      email: null,
      image: null,
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
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = String(token.fortyTwoId);
      session.user.login = String(token.login);
      return session;
    },
  },
});
