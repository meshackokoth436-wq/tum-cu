# TECUMP Final Production Pass — 25 Sep 2026

This package includes the final landing-media persistence pass and glassmorphism authentication UI.

## Included

- Supplied `/public/auth-background.jpg` used by Login and Register.
- Login/Register use backend JWT authentication; no Firebase authentication flow is used by the auth pages.
- Landing-page hero carousel remains editable by authorized administrators.
- Landing-page backdrop carousel is now persisted in MySQL through `landing_media_backdrops`.
- Landing backdrop rotation uses the administrator-configured rotation interval and crossfades between active images.
- Landing gallery remains database-backed.
- Ministry landing image and caption remain database-backed through migration 009.
- Uploaded media is written to `public/uploads`; mount `/app/public/uploads` as a Railway Volume in production.
- Landing-media writes use a database transaction and only update in-memory state after the database commit succeeds.
- Landing-media upload validation rejects unsupported image formats and files over 8 MB.
- Ministry CRUD/background/leader/session management routes have backend permission gates.
- Fixed a pre-existing JSX syntax error in `LibrarianPortalPage.tsx`.

## Persistence model

Configuration and metadata: MySQL.

Actual uploaded files: Railway persistent volume at `/app/public/uploads`.

Do not use browser localStorage as the source of truth for administrator-managed media.

## Railway deployment

1. Create Railway MySQL service.
2. Configure DB variables on the web service.
3. Set the Railway pre-deploy command to `npm run db:migrate`.
4. Mount a Railway Volume at `/app/public/uploads`.
5. Set the healthcheck path to `/health`.
6. Set production JWT secrets and `CORS_ORIGIN`.
7. Keep `GEMINI_API_KEY` server-side only.
8. Do not automatically run the production seed command.

## Verification note

A full dependency-backed production build could not be executed in this environment because package installation timed out and the workspace has no installed `node_modules`. Global TypeScript parsing was used to verify syntax; the previously identified LibrarianPortal JSX syntax error was corrected. Full `npm run build` and `npm run lint` should be run in CI/Railway after dependency installation.
