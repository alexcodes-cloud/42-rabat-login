import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '42 Rabat Login',
  description: 'A minimal 42 Intra OAuth login restricted to the Rabat campus.',
};

/** Provides the minimal document shell without adding a styling dependency. */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
