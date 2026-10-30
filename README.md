# WLEEDMOVIE

A movie and TV discovery site built with Next.js, TypeScript, and TMDB. Titles and poster artwork remain in English; available movie, series, and episode overviews are shown in Arabic.

**Live site:** [cinema-three-wheat.vercel.app](https://cinema-three-wheat.vercel.app/)

## Features

- Featured titles, horizontal catalog rails, search, provider pages, and filters.
- Movie details with cast, ratings, production information, and a watch section.
- TV details with cast and a season picker. Only the selected season's episodes load when opening a series.
- Multiple embedded player sources, subtitle lookup, and SRT download where available.
- Continue Watching, playback progress, My List, and appearance themes stored in the browser.
- A `/guide` page with a silent subtitle walkthrough, plus an optional first-visit Brave recommendation with iPhone/iPad and Windows download links. Visitors can hide the recommendation permanently in their browser.
- A direct `/admin` page for visitor and watching statistics; it has no public navigation link.
- Responsive layouts for phones, tablets, and desktops.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, CSS, TMDB API, Prisma with SQLite for legacy subtitle data, and optional Upstash Redis for analytics.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm ci` in this directory.
3. Copy `.env.example` to `.env.local` and set `TMDB_API_KEY` to your own TMDB API key.
4. Run `npm run dev` and open [localhost:3000](http://localhost:3000/).

Use `npm run build` to check the production build and `npm run start` to serve that build locally. For SQLite-backed subtitle records, set `DATABASE_URL` and run `npx prisma migrate deploy`. Run `npx prisma db seed` only if you want the sample data from `prisma/seed.ts`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `TMDB_API_KEY` | Required for the catalog and title details. |
| `SUBDL_API_KEY` | Optional subtitle search and download. |
| `OPENSUBTITLES_API_KEY` | Optional fallback subtitle provider. |
| `DATABASE_URL` | SQLite connection used by the Prisma subtitle tables, for example `file:./dev.db`. |
| `ADMIN_PASSWORD_HASH` | Admin password hash in `salt:hash` format (16-byte hex salt, 32-byte scrypt hash). |
| `ADMIN_SESSION_SECRET` | Secret used to sign admin sessions. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional analytics storage. The Vercel `KV_REST_API_URL` / `KV_REST_API_TOKEN` equivalents also work. |

Keep actual values in local environment files or Vercel project settings. Do not commit them. The `.env.example` file contains placeholders only.

## Deployment

The production site is hosted on Vercel. Add the required environment variables to the project before deploying. `npm run build` should pass locally before a production deployment. TMDB data requests use a one-hour revalidation window.

## Data and limitations

- TMDB supplies metadata and artwork. If TMDB has no Arabic overview for a title or episode, the site shows an Arabic availability message instead of an English description.
- Provider discovery currently uses the US region. Availability can differ in other countries.
- My List and Continue Watching are saved in each browser's local storage and do not sync across devices.
- Embedded players are operated by third parties. Their content availability, advertisements, playback controls, and subtitle menus can change independently of this site.
- Admin activity counts visitors seen in the last 90 seconds. "Watching now" means the player is visible; embedded providers do not always expose a reliable play event.
