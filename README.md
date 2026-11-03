# ZimWatchline: a personal news and media site

This is a news site and media archive for one independent journalist. The journalist writes articles and publishes them, uploads photos and video from events, and groups the coverage by event, category and tag. Visitors can browse, search and filter all of it.

There is a single administrator. Visitors can't register, there are no comments, and there's no multi-author workflow.

**Stack:** Next.js 16 (App Router, Server Components, Server Actions) · TypeScript · Tailwind CSS v4 · shadcn/ui · Prisma + SQLite (Turso/libSQL in production) · Cloudinary · Tiptap · Lucide.

---

## Features

**Public site**

- **Home:** a large featured story with a "Latest News" list beside it, an asymmetric Top Stories grid, recent events, and photo highlights in varied tile sizes.
- **News (`/news`):** search across title, body, event name, location and tags. You can filter by event, category, a single date, a date range, year, or featured articles, and sort newest or oldest first. Filters are stored in the URL and results are paginated.
- **Article (`/news/[slug]`):** headline, subtitle, byline, category, publication date, event date and location. The lead photo has a caption and opens in a lightbox. The body supports headings, lists, quotes, links and inline images with captions. An article can also have extra photographs, an embedded video, tags, share links, an author box and related articles.
- **Events (`/events`, `/events/[slug]`):** an archive grouped by year. Each event page shows its description, reports, photographs and videos.
- **Gallery (`/gallery`):** a masonry grid you can filter by event, year, date and type (photo or video). The lightbox shows a large image, caption, event, date and location, with previous/next buttons, keyboard arrows and swipe.
- **Search (`/search`):** one search across articles and events.
- **SEO:** per-page titles and descriptions, Open Graph and Twitter cards, canonical URLs, `NewsArticle` and `Event` JSON-LD, `sitemap.xml`, `robots.txt` and a generated default share image. Drafts are never public. The admin area sends `noindex`.

**Admin (`/admin`)**

- **Dashboard:** counts of published articles, drafts, events and photos, plus recent articles and recent events.
- **Articles:** a table with search, filters (status, category, event, featured) and sorting. From the table you can publish or unpublish, mark as featured, preview, edit or delete in one click.
- **Article editor:** a large headline field and a slug generated from it, which you can edit. It also has the subtitle, a Tiptap rich-text body (inline images with captions), category, event (which fills in the event date and location), featured image and caption, additional photos, a video URL, tags, a publication date and a featured toggle. Buttons: **Save draft**, **Preview** and **Publish**.
- **Events:** create, edit and delete events, with a cover image, dates, location and description. You can link articles and photos to an event.
- **Media library:** upload by drag and drop (several files at once, with a progress bar per file). You can add YouTube, Vimeo or Facebook video links, edit captions, dates and locations, assign an event or article, search and filter, copy a URL, and delete.
- **Categories:** add, rename and delete. The 11 default categories are created when you run the seed.
- **Settings:** site name, tagline, byline, bio, portrait, contact details, social links and password change.

---

## Quick start (local)

Requirements: Node.js 20.9 or newer, and npm.

```bash
npm install
cp .env.example .env          # then edit ADMIN_EMAIL, ADMIN_PASSWORD and the Cloudinary keys
npm run db:push               # creates prisma/dev.db from the schema
npm run db:seed               # creates the admin (bcrypt-hashed), categories and settings
npm run dev
```

Open <http://localhost:3000>. Sign in at <http://localhost:3000/admin/login>.

**Optional demo content.** This fills the site with President Mnangagwa's 2026 public
programme — 13 events from the World Governments Summit in February to the Third
Russia–Africa Summit in October, 20 published articles, a draft, and 55 credited photographs:

```bash
npm run db:demo               # add demo content
npm run db:demo -- --clear    # remove it again (only removes what the demo created)
```

The events, dates, venues and names are real, drawn from public reporting and primary
documents such as the COMESA final communiqué. The article text is demonstration copy,
not filed journalism, and every piece ends with a note saying so — rewrite and re-verify
before publishing anything under a byline.

Every photograph is a real, freely licensed file from Wikimedia Commons — no stock imagery
and no placeholders. Where a free picture of the President exists it is used; otherwise the
picture is of the actual place or subject the story is about, such as the New Parliament
Building at Mount Hampden, the National Heroes Acre, the Matobo Hills, Masvingo farmland,
Chinhoyi, or lithium-bearing ore from Bikita. Each caption states what the picture shows,
when it was taken and who took it, with the licence named, so an archive frame is never
passed off as coverage of a later event. Replace any of them with your own pictures via
**Admin → Media**.

Those originals are big — some are over 30MB — so nothing loads them directly. The custom
image loader rewrites every Commons URL to one of Wikimedia's permitted thumbnail widths
(`src/lib/image-sources.ts`), `next.config.ts` asks `next/image` for exactly those widths,
and the lightbox caps itself at 1920px. For the demo set that is 3.6MB of thumbnails in
place of 321MB of originals.

For a production site, prefer re-hosting the pictures on your own Cloudinary account
(**Admin → Media**) rather than hotlinking Wikimedia, which rate-limits external traffic.

Running it also sets the site name, tagline and author details in **Settings**; `--clear`
leaves those as they are.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run db:push` | Apply `prisma/schema.prisma` to the database |
| `npm run db:seed` | Seed the admin, default categories and settings (safe to re-run) |
| `npm run db:demo` | Add or clear the demo content |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run lint` / `npm run typecheck` | Lint and type-check |

---

## Cloudinary setup

1. Create a free account at <https://cloudinary.com>.
2. In **Settings → API Keys**, copy the Cloud name, API key and API secret into `.env`.
3. Restart the dev server. **Admin → Settings → Media storage** should now say "Connected".

### How uploads are secured

1. The browser asks `POST /api/admin/upload-signature` for permission. The route checks the admin session and the file's size and type, then returns a short-lived signature. The signature fixes the upload folder and the allowed formats. **The API secret never leaves the server.**
2. The browser uploads the file directly to Cloudinary, so large videos don't pass through your server.
3. The browser then calls a server action. That action looks up the uploaded file through the Cloudinary Admin API and checks that it exists, is in the right folder, and is an allowed format and size. Files that fail the check are deleted. Only then is the metadata saved to SQLite. Image files themselves are never stored in the database.

Limits match Cloudinary Free:

| Type | Maximum size | Formats |
| --- | --- | --- |
| Photos | 10 MB | JPG, PNG, WebP, GIF, AVIF, HEIC |
| Videos | 100 MB | MP4, MOV, WebM, M4V |

Images are served through Cloudinary's CDN with automatic format and quality, resized to each layout (see `src/lib/image-loader.ts`).

---

## Authentication

- One administrator, created by `npm run db:seed` from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The password is hashed with **bcrypt** (cost 12). There is no registration route.
- **Sessions:** the cookie holds a random 256-bit token and is `HttpOnly`, `SameSite=Lax`, and `Secure` in production. The database stores only a SHA-256 hash of the token. Sessions expire after 7 days.
- **Rate limiting:** after 5 failed logins within 15 minutes, logins are locked for 15 minutes, both per IP address and per IP+email. Attempts are recorded in SQLite, so the limit survives restarts.
- **Protection in layers:**
  - `src/proxy.ts` redirects visitors without a session cookie away from `/admin`.
  - Every admin page, server action and API route also checks the session against the database (`requireAdmin()` / `getCurrentAdmin()`).
- **Forgot your password?** Set a new `ADMIN_PASSWORD` and `ADMIN_RESET_PASSWORD=true`, then run `npm run db:seed`. This also signs out all sessions.

---

## Deployment

SQLite is a file, so **the database must live on persistent storage.** Pick one of these two options.

### Option A: Vercel (or any serverless host) with Turso

Serverless file systems are temporary, so use [Turso](https://turso.tech), which is hosted SQLite (libSQL) with a free tier.

```bash
# 1. Create the database
turso db create zimwatchline
turso db show zimwatchline --url          # → TURSO_DATABASE_URL
turso db tokens create zimwatchline       # → TURSO_AUTH_TOKEN

# 2. Create the tables: generate SQL from the Prisma schema and apply it
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > schema.sql
turso db shell zimwatchline < schema.sql

# 3. Seed the admin and categories against Turso (run locally with the Turso variables set)
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed

# 4. Optional: put the demo content in too, so the site is not empty on first load
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:demo
```

Then, in Vercel:

1. Import the repository. Vercel detects Next.js; the default build and install
   commands are correct, so there is nothing to override and no `vercel.json`.
2. Set these environment variables:
   - `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
   - the three `CLOUDINARY_*` keys and `CLOUDINARY_FOLDER`
   - `NEXT_PUBLIC_SITE_URL` — optional. Left unset, a deployment uses its own
     Vercel domain, so canonical links, Open Graph tags, `robots.txt` and the
     sitemap are right from the first deploy. Set it once you add a custom domain.
   - `DATABASE_URL` is **not** needed here. It is only the local SQLite file; when
     the Turso variables are set the app never looks at it, and the build does not
     read it either.
3. Deploy. `prisma generate` runs in both `postinstall` and `build`, so the client
   is regenerated even when Vercel restores `node_modules` from its build cache.

Notes specific to Vercel:

- **The build needs no database at all.** Every route is `force-dynamic`, including
  the root layout — which matters because the built-in `/_not-found` page renders
  inside it, and prerendering that page would otherwise query the database at build
  time. The Prisma client is also created on first query rather than on import
  (`src/lib/db.ts`), so collecting page data cannot fail on missing credentials.
  A deploy with no environment variables set still builds; it only fails when a
  request actually tries to read data.
- Images use a custom loader (`src/lib/image-sources.ts`), so Vercel's Image
  Optimization is not used and incurs no cost.
- `engines.node` is `>=20.9.0`, matching Next 16's own requirement.
- Server Actions accept 4MB bodies, just inside Vercel's 4.5MB request limit.

**Changing the schema later:** run `prisma migrate diff --from-url <old> --to-schema-datamodel ...` (or write the `ALTER TABLE` by hand) and apply it with `turso db shell`.

### Option B: a VPS, Railway, Fly.io or Render with a persistent disk

1. Mount a persistent volume, for example at `/data`.
2. Set `DATABASE_URL="file:/data/zimwatchline.db"`, `NEXT_PUBLIC_SITE_URL`, the `ADMIN_*` variables and the `CLOUDINARY_*` keys.
3. Build and start:

   ```bash
   npm ci
   npm run db:push && npm run db:seed
   npm run build
   npm start              # listens on $PORT (default 3000)
   ```

4. Back up the `.db` file regularly, for example with a nightly `sqlite3 zimwatchline.db ".backup backup.db"`.

**Behind a reverse proxy** (Nginx, Caddy), forward `X-Forwarded-For` so login rate limiting sees each visitor's real IP address.

---

## Project structure

```
prisma/
  schema.prisma        Data model (Admin, Session, LoginAttempt, Article, Event, Media, Category, Tag, Setting)
  seed.ts              Admin, default categories and settings
  seed-demo.ts         Optional demo content (the 2026 presidential diary)
src/
  proxy.ts             Optimistic redirect for /admin
  app/
    (site)/            Public pages: home, news, article, events, gallery, search
    admin/login/       Sign-in page
    admin/(panel)/     Dashboard, articles, events, media, categories, settings
    admin/preview/     Draft preview using the public layout
    admin/actions/     Server actions (all call requireAdmin)
    api/admin/upload-signature/   Cloudinary signing endpoint
    sitemap.ts, robots.ts, opengraph-image.tsx
  components/
    site/              Editorial grid, cards, lightbox, photo grid, filters…
    admin/             Editor, media picker and uploader, forms
    ui/                shadcn/ui primitives
  lib/                 db, auth, queries, cloudinary, sanitising, helpers
```

## Content notes

- **Featured story:** the homepage shows the most recent article marked **Featured**. If no article is featured, it shows the latest published article.
- **Additional photographs** are reusable, and the same photo can appear in several articles. When you attach a photo to an article, it takes on that article's event if it doesn't already have one.
- **Article HTML** is sanitised on the server before it is saved, and only the formatting the editor produces is allowed.
- **Deleting media** removes the file from Cloudinary and clears any featured image or cover image that pointed to it.
