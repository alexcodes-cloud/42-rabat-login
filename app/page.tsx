import { auth, signIn, signOut } from '@/auth';

/** Offers the login action and shows the small session payload after sign-in. */
export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return (
      <main>
        <h1>42 Rabat Login</h1>
        <p>Sign in with a 42 Intra account that belongs to the Rabat campus.</p>
        <form action={async () => {
          'use server';
          await signIn('42', { redirectTo: '/' });
        }}>
          <button type="submit">Continue with 42</button>
        </form>
      </main>
    );
  }

  return (
    <main>
      <h1>Signed in</h1>
      <p>42 login: {session.user.login}</p>
      <p>42 user ID: {session.user.id}</p>
      {session.user.image ? <img src={session.user.image} alt={`42 profile photo for ${session.user.login}`} width={160} height={160} /> : <p>No 42 profile photo is available.</p>}
      <form action={async () => {
        'use server';
        await signOut({ redirectTo: '/' });
      }}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
