This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

## Admin Login

V1.3 adds administrator-only access protection. The system does not provide
public registration or a multi-user account system.

Create `.env.local` for local development:

```bash
ADMIN_PASSWORD=你的管理员密码
```

When deploying to Vercel, add the same environment variable in the Vercel
project settings:

```bash
ADMIN_PASSWORD=你的管理员密码
```

Do not commit `.env.local` or real passwords to Git. The login session uses an
httpOnly cookie named `dental_ads_auth`; in production the cookie is marked
`secure`.

## Supabase V1.6.1

V1.6.1 only adds the Supabase connection foundation. It checks whether the
environment variables are configured, but it does not save uploaded files yet.

Add these variables locally in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase 项目 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 anon key
SUPABASE_SERVICE_ROLE_KEY=你的 service role key
```

On Vercel, add the same variables in the project settings. Do not expose the
service role key in browser code. The page `/data-sources/supabase-status`
only shows whether each variable is configured; it never prints the real key.

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
