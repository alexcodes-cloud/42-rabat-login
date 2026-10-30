/** Explains whether the OAuth setup or Rabat membership blocked sign-in. */
export default async function Denied({ searchParams }: { searchParams: Promise<{ reason?: string; error?: string }> }) {
  const params = await searchParams;
  const rabatDenied = params.reason === 'rabat';

  return (
    <main>
      <h1>Access denied</h1>
      {rabatDenied ? (
        <p>This example only accepts 42 accounts with Rabat campus membership.</p>
      ) : (
        <p>42 rejected the sign-in request. Check the production callback URL and Vercel environment variables.</p>
      )}
      <a href="/">Try again</a>
    </main>
  );
}
