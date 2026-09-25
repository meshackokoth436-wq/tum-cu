# TUMCU / TECUMP deployment guide

## Recommended production architecture

- Frontend: Vercel, Netlify, Cloudflare Pages, or the included Nginx Docker image.
- API: a Node 20+ container/VM with HTTPS.
- Database: managed MySQL 8+.
- Redis: managed Redis or the included container for a single-host deployment.
- Email: SMTP provider for membership and system notifications.

## Local production-like test

1. Copy `.env.example` to `.env`.
2. Replace every password/secret with a strong random value.
3. Run `docker compose up --build`.
4. Open `http://localhost:5173`.
5. Verify API readiness at `http://localhost:4000/health/ready`.
6. Create the first administrator from the backend container:
   `docker compose exec backend node dist/database/create-admin.js --email you@example.com --name "Your Name"`
7. Log in, submit a test membership application from a separate browser/incognito window, then approve it from the administrator dashboard.
8. Verify events, attendance, prayer, meetings and finance workflows.

## Separate frontend/API deployment

Set the frontend environment variable:

`VITE_API_URL=https://YOUR-API-DOMAIN/api/v1`

Set the backend:

`CORS_ORIGIN=https://YOUR-FRONTEND-DOMAIN`

Do not leave localhost in `CORS_ORIGIN` in production.

## Database

The backend container runs versioned migrations before starting the API. For managed deployments, it is safer to run migrations as a release step and then deploy the application.

Never delete production data to apply a schema change. Add a new numbered migration instead.

## Important production checks

- HTTPS is mandatory.
- Use unique JWT access and refresh secrets.
- Use a managed database with automated backups.
- Configure SMTP and verify the sender domain.
- Keep `.env` out of git.
- Run `npm run build` for both frontend and backend in CI before deployment.
- Run backend unit/integration tests against a disposable test database.
- Configure monitoring against `/health/live` and `/health/ready`.
- Restrict database and Redis ports from the public internet.


## Shared cloud data and cross-device updates

This deployment uses a single server-side MySQL database as the source of truth. The browser does not store application records as the authoritative data. All dashboards, applications, events, ministries, attendance, prayer requests and administrative records are fetched through the API.

The frontend now automatically refreshes active React Query data every 15 seconds, refetches when the browser regains focus, and refetches after reconnecting to the internet. This means an update made by an administrator on one device becomes visible on other currently-open devices automatically, normally within 15 seconds (and sooner when the page regains focus).

For a production deployment, keep MySQL and Redis private. Only expose the frontend HTTPS port to the internet. The included Nginx configuration proxies `/api/*` to the backend, so the browser can use the same public origin and does not need a separate API domain.

### Recommended production architecture

`Internet -> HTTPS reverse proxy/load balancer -> TUMCU frontend (Nginx) -> TUMCU backend -> MySQL`

Redis is included for future distributed jobs/events and is intentionally not exposed publicly.

### Deploy with Docker on a VPS

1. Copy `.env.production.example` to `.env`.
2. Replace every secret and set `CORS_ORIGIN` to the exact public HTTPS origin.
3. Point your domain DNS record to the server.
4. Put TLS/HTTPS in front of port 80 using Caddy, Traefik, or a cloud load balancer.
5. Run `docker compose up -d --build`.
6. Verify `https://YOUR-DOMAIN/` and `https://YOUR-DOMAIN/api/v1/...` through the same origin.
7. Back up the `mysql_data` volume/database regularly.

### Important deployment rule

Do not deploy separate copies of MySQL for different frontend/backend instances. Every application instance must point to the same production database; otherwise updates will not be shared across devices.

## Hostinger deployment (recommended managed Node.js route)

TECUMP can run on Hostinger's Node.js Web App hosting because the project uses React/Vite for the frontend and Express for the backend. Hostinger currently supports Node.js Web Apps on Business Web Hosting and Cloud plans, with Node.js 18/20/22/24 runtimes. For this project, use Node.js 22.x unless Hostinger requires another supported version. See Hostinger's current Node.js documentation before deployment.

### Hostinger application settings

- Application type/framework: Node.js / Other if automatic detection does not identify the combined Vite + Express application.
- Node.js version: 22.x.
- Install command: `npm install` (the current project archive does not include a root lockfile; once a lockfile is generated and committed in your normal development environment, switch this to `npm ci`).
- Build command: `npm run build`.
- Start command: `npm start`.
- Application port: use the port Hostinger assigns through `PORT` (the app already reads `process.env.PORT`).
- Do not expose MySQL publicly. Use Hostinger's local MySQL hostname/credentials for the Node.js application.
- Add all production environment variables through Hostinger's Environment Variables panel; never upload `.env`.

### Database release step

Before the first production start, create the Hostinger MySQL database/user and run the versioned migrations with:

`npm run migrate`

Then create the first administrator explicitly with:

`npm run create:admin -- --email admin@example.com --name "TUMCU Administrator"`

Do NOT run the development/demo memory seed as a substitute for the production database. Production must use MySQL as its source of truth.

### Important security requirements

- Set unique random JWT access and refresh secrets (32+ characters each).
- Set `CORS_ORIGIN` to the exact HTTPS domain.
- Never use `CORS_ORIGIN=*` in production.
- Never commit `.env` or database credentials.
- Keep the Hostinger MySQL credentials server-side only.
- Enable HTTPS/SSL before opening the application to members.
- Confirm `/health/ready` reports database readiness after deployment.
- Create the real administrator with `create:admin`; do not use a demo/default administrator password.

### Hostinger vs VPS

Managed Node.js hosting is the simpler option for this application. Choose a Hostinger VPS if you specifically need Docker Compose, Redis administration, custom reverse-proxy configuration, root access, or other server-level controls. Hostinger documents Docker/full server control as a VPS use case.


## Production authentication security

Refresh tokens are issued only as an HttpOnly, Secure, SameSite=Lax cookie in production. The frontend keeps only the short-lived access token in memory and obtains a new one from `/api/v1/auth/refresh` after a page reload. The refresh and logout endpoints do not accept refresh tokens in request bodies. Do not add refresh tokens back to localStorage, sessionStorage, Zustand persistence, or React state.

For a same-origin Hostinger deployment, set `CORS_ORIGIN` to the exact HTTPS site origin. If the frontend and API are deployed on different sites, review the cookie SameSite policy before deployment.

## AI Assistant
Set `GEMINI_API_KEY` as a server-side environment variable. Never expose this key in VITE client variables. The chatbot uses Gemini 3.8 Flash and is rate-limited server-side.
