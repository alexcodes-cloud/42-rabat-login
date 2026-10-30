import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      login: string;
    } & DefaultSession['user'];
  }

  interface User {
    login?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    fortyTwoId?: string;
    login?: string;
    photoPath?: string;
  }
}
