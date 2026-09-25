# TUMCU Platform — Release Readiness

## Included
- Data-driven dashboard using live membership, event, attendance and prayer APIs.
- Administrative application queue with submitted + under-review states, search, refresh and automatic polling.
- Improved responsive navigation and account controls.
- Server-backed logout with safe local fallback.
- Concurrent JWT refresh protection to prevent multiple refresh requests on simultaneous 401 responses.
- Registration validation before the application can be submitted.
- SPA fallback/404 handling.
- Docker production configuration with environment-driven secrets, service health checks and persistent Redis.
- Deployment guide and environment template.

## Validation
The source package was inspected and the application build commands are configured. A full dependency-based TypeScript/Vite build could not be completed in this sandbox because the uploaded archive's dependency installation did not finish within the available execution window; no source-level build result is being claimed as passed.

## 2026-09-24 — Persistent Ministry Landing Profiles
- Added MySQL migration `009_ministry_landing_profiles.sql` for ministry category, landing image URL, and landing caption.
- Admin ministry editor now saves ministry details to the backend instead of React-only state.
- Admins can upload a ministry landing/profile image and edit its public caption.
- Ministry profile images use the existing server-side image uploader and are intended for Railway's persistent `/app/public/uploads` volume.
- Added a public ministry profile section to the home/landing page, driven by the MySQL ministry records.
- Tightened ministry CRUD routes to require `ministries.create`, `ministries.edit`, `ministries.delete`, or `system.manage_roles`.
- Ministry background-image caching now happens only after the database save succeeds.

### Final production pass — 25 Sep 2026
- Added persistent MySQL-backed landing backdrop carousel (`010_landing_media_backdrops.sql`).
- Made landing backdrop rotation use the saved admin interval and active slide set.
- Added transactional landing-media persistence so failed DB writes are not reported as successful saves.
- Kept ministry landing photos/captions database-backed.
- Added the supplied authentication background image and retained glassmorphism Login/Register UI.
- Added upload validation for JPG/JPEG, PNG and WEBP images up to 8 MB.
- Fixed a pre-existing JSX closing-tag error in `LibrarianPortalPage.tsx`.
