# TECUMP — Railway Deployment Guide

This project is prepared to run as one Railway web service plus one Railway MySQL service.

## Architecture

- `tecump-web`: React/Vite + Express in one Node.js service
- `MySQL`: Railway MySQL service
- Railway Volume mounted at `/app/public/uploads` for persistent uploaded files
- Gemini API accessed server-side through `GEMINI_API_KEY`

Railway injects a `PORT`; the application listens on that value.

## 1. Create the Railway project

1. Create a Railway project.
2. Add a **MySQL** database service.
3. Add the TECUMP repository as the web service, or deploy this directory with the Railway CLI.
4. Railway can deploy the included `Dockerfile` directly.

## 2. MySQL variables

Railway's MySQL service provides:

- `MYSQLHOST`
- `MYSQLPORT`
- `MYSQLUSER`
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQL_URL`

In the TECUMP web service, create references to the MySQL service:

```text
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}
```

If your MySQL service has a different service name, use that name in the reference expression.

## 3. Required web-service variables

Set these in Railway Variables:

```text
NODE_ENV=production
API_PREFIX=/api/v1
JWT_ACCESS_SECRET=<long random secret, 32+ chars>
JWT_REFRESH_SECRET=<different long random secret, 32+ chars>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
CORS_ORIGIN=https://YOUR-RAILWAY-DOMAIN
GEMINI_API_KEY=<your Gemini API key>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
DB_CONNECTION_LIMIT=10
NOTIFICATION_DISPATCH_INTERVAL_MS=30000
```

Do not put `GEMINI_API_KEY` in a `VITE_*` variable.

Do not use `*` for `CORS_ORIGIN` in production.

## 4. Build/start

The included Dockerfile performs:

```text
npm install
npm run build
npm run start
```

The production server listens on Railway's injected `PORT`.

## 5. Database migrations

Configure Railway's **Pre-Deploy Command** for the web service as:

```bash
npm run db:migrate
```

This applies all pending SQL migrations in filename order and records completed migrations in `schema_migrations`.

Do NOT run the seed command automatically in production. The seed contains development/default content and should not overwrite or duplicate production data.

## 6. Health check

Set the Railway Healthcheck Path to:

```text
/health
```

The application returns HTTP 200 from this endpoint when the process is alive.

## 7. Persistent uploads

Create a Railway Volume attached to the web service with this mount path:

```text
/app/public/uploads
```

This preserves:

- leader profile photos
- landing-media uploads
- E-Library uploaded files/resources
- other application uploads stored under `public/uploads`

Do not rely on the normal container filesystem for these files.

## 8. Generate the Railway domain

After deployment:

Service → Settings → Networking → Generate Domain

Then set:

```text
CORS_ORIGIN=https://your-generated-domain.up.railway.app
```

Redeploy after changing the variable.

## 9. First administrator

After the first successful migration, use the Railway service shell/CLI to create the real administrator:

```bash
npm run create:admin
```

Follow the prompts. Do not use development passwords in production.

## 10. Test before going live

Test all of these:

- Registration → pending approval → Admin approval → login
- Logout and secure refresh
- Member RBAC
- Super Admin RBAC
- Leaders directory and leader profile editing
- E-Library upload/download
- Physical book catalogue
- Copy counts
- Unlisted physical-book lending
- Returns and overdue status
- E-Teams: NET MINISTRIES TRUST TUM UNIT and NORET-SORET
- Weekly programme persistence
- Landing media persistence
- Ministry image persistence
- AI chatbot
- Mobile/PWA installation
- Browser refresh and backend restart persistence

## 11. Updating TECUMP

Recommended production workflow:

```text
Edit locally
   ↓
Test locally
   ↓
Commit to GitHub
   ↓
Railway deploys the new commit
   ↓
Pre-deploy migration
   ↓
Health check /health
   ↓
New version becomes active
```

Keep the MySQL database separate from the web-service container.

## 12. Backups

Configure Railway MySQL backups before using TECUMP with real member data. Also keep periodic exports of important uploaded files.

## 13. PWA / phone installation

TECUMP includes a PWA manifest/service worker. Once deployed over HTTPS, supported browsers can offer **Install app / Add to Home screen**. This installs the web app shell on the phone; it is not an APK.

## 14. Downloading deployed files

Railway provides CLI tools to browse/download files from a running service or its volume. This is useful for recovery and inspection, but your canonical application source should remain in GitHub/local backups rather than treating the running container as the source repository.
