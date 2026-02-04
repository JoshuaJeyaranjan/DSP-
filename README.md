# DSP- (Developer README)

This README is focused on developers who want to build, run, and contribute to the DSP- front-end/admin application.

## Quick overview

- Framework: Vite + React (plugin: @vitejs/plugin-react-swc)
- Styling: SCSS + plain CSS
- Data: Supabase (client + admin/service-role client)
- Repository layout: single-page React app with an admin area under `src/Pages`.

## Prerequisites

- Node.js (recommended 18.x or newer)
- npm
- A Supabase project (for local development you can use a dev Supabase instance or the hosted project)

## Install

Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd DSP-
npm install
```

## Environment variables

Create a `.env` file at the project root (Vite expects `import.meta.env` variables prefixed with `VITE_`). The app expects at least the following:

```
VITE_PROJECT_URL=<your-supabase-project-url>
VITE_ANON_KEY=<your-supabase-anon-key>
VITE_SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key> # used by server/admin utilities
```

Notes:
- Keep the service role key secret. Do not commit it. If you need server-side functions, prefer using Supabase Edge Functions or a separate server and pass only safe tokens to the client.
- If you only want to run the public client parts, `VITE_PROJECT_URL` + `VITE_ANON_KEY` are sufficient.

## Available scripts

- `npm run dev` — start Vite dev server (hot reload)
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint
- `npm run format` — run Prettier formatting on source files

Example: start the dev server

```bash
npm run dev
```

Open http://localhost:5173 (or the port printed by Vite).

## Project structure (high level)

- `src/`
	- `App.jsx`, `main.jsx` — app entry and routing
	- `Components/` — reusable UI components (Nav, Footer, galleries, etc.)
	- `Pages/` — page-level components (Admin pages, Home, Contact, etc.)
	- `utils/` — helpers and Supabase clients (`supabaseClient.js`, `supabaseAdmin.js`, `youtube.js`)
	- `styles/` — SCSS/CSS variables and globals
- `public/` — static assets
- `supabase/functions/` — serverless/edge functions (Deno/Node implementations used by the Supabase project)

Key files to know:
- `src/utils/supabaseClient.js` — public supabase client (uses `VITE_ANON_KEY`)
- `src/utils/supabaseAdmin.js` — admin/service client (uses `VITE_SUPABASE_SERVICE_ROLE_KEY`)
- `src/Pages/AdminVideoPage/AdminVideoPage.jsx` and `src/Pages/AdminPhotoCategoriesPage/AdminPhotoCategoriesPage.jsx` — admin UI for video/photo categories

## Supabase functions

The `supabase/functions/` directory contains edge functions / server-side utilities. Inspect the individual function folders for runtime and deploy details. These may use Deno or Node depending on the function.

## Debugging & common issues

- JSX parse errors (e.g. `Expected '</', got '{'`) are often caused by stray `{`/`}` or unclosed JSX elements. The Vite stack trace indicates the file and line number — inspect the JSX around that location.
- If Vite fails to start, ensure your `.env` file has required `VITE_` variables. Missing environment variables used at module load-time can cause runtime errors during bundling.
- If Supabase responses fail, check network console and ensure your Supabase keys & URL are correct.

Quick tips:
- Use `console.error` or the browser console when debugging runtime errors.
- To verify an exported component's syntax, run `npm run build` — Vite's build will reveal compilation issues the dev server sometimes masks.

## Contributing

- Fork or branch from `main` for features/bugfixes.
- Keep changes small and focused. Add a short description to the PR explaining the intent and the verification steps.

Suggested checklist for PRs:
- Lint/format (`npm run lint`, `npm run format`)
- Manual smoke-test in the browser (check admin pages if you touched them)
- Add small tests or screenshots for UI changes if helpful

## Extending / running tests

There are no automated tests in this repo by default. If you add tests, prefer Jest + React Testing Library or Vitest depending on preference.

## Deploy

- Build the app: `npm run build`
- Deploy the generated `dist/` to your static hosting (Netlify, Vercel, Surge, etc.) or serve via a static server.
- Ensure your production environment has the same `VITE_` variables configured.

## Contacts and notes

If you need help with Supabase or deployment details, include the relevant logs and the `.env` variables (except secrets) when asking for help.
