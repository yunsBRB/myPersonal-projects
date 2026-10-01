# NutriScan

A food scanning prototype built with Next.js, React and TypeScript. Includes product search, nutrition information and ingredient analysis.

## Run

Use Node.js compatible with Next.js 14. From this folder:

```sh
npm install
npm run dev
```

Open http://localhost:3000. Optional analysis routes require server-side `OPENAI_API_KEY` and `GOOGLE_VISION_API_KEY` values in an untracked `.env.local`; these services may incur charges.

## Status

Authentication is simulated. Premium screens are not a working subscription system. Server-side authentication, quotas and access controls are required before public deployment. Dependencies are not yet locked.

Check with `npm run lint` and `npm run build`.
