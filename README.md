# 42 Rabat Login

Minimal Next.js + Auth.js example for signing in with 42 Intra. It accepts only accounts whose `/v2/me` response contains Rabat campus `75`.

## Local test

```sh
cp .env.example .env.local
# Fill in FORTYTWO_CLIENT_ID, FORTYTWO_CLIENT_SECRET, and AUTH_SECRET.
npm install
npm run dev
```

Register this exact callback URL in the 42 application:

```text
http://localhost:3000/api/auth/callback/42
```

Then open `http://localhost:3000`.

## Vercel

Create a Vercel project with this directory as its **Root Directory**: `42-login`.

Add these environment variables to the Vercel project:

- `FORTYTWO_CLIENT_ID`
- `FORTYTWO_CLIENT_SECRET`
- `AUTH_SECRET`
- `AUTH_URL` set to the deployed URL, for example `https://your-project.vercel.app`
- `AUTH_TRUST_HOST=true`

Register this exact production callback URL in the 42 application:

```text
https://your-project.vercel.app/api/auth/callback/42
```

The 42 client secret and `AUTH_SECRET` must stay server-side and must not be committed.
