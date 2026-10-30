/** Explains why accounts outside the Rabat campus cannot create a session. */
export default function Denied() {
  return (
    <main>
      <h1>Access denied</h1>
      <p>This example only accepts 42 accounts with Rabat campus membership.</p>
      <a href="/">Try again</a>
    </main>
  );
}
