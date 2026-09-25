TECUMP MEMBERSHIP APPLICATION FIX
=================================

Replace the files in this package at the exact same paths in your project.

Main fixes:
1. Production no longer silently falls back to an in-memory database when MySQL fails.
2. Production startup fails if MySQL cannot be verified.
3. Registration writes the user + membership application in one MySQL transaction.
4. Department and year_of_study collected by the registration form are persisted.
5. Admin application loading uses the canonical /membership/applications endpoint and no longer hides API failures by returning an empty array.
6. Approval uses the same transaction connection for creating the membership, so partial approvals are rolled back correctly.
7. Local/test development can still use the existing memory store.

DEPLOYMENT CHECKLIST
--------------------
- Set NODE_ENV=production on the backend.
- Configure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME to the real persistent MySQL database.
- Run the existing database migration/seed process if the database has not been initialized.
- Restart/redeploy the backend after replacing the files.
- Open GET /health/ready. It must return HTTP 200 with database=true.
- Submit one fresh membership application.
- Confirm it appears under the admin Membership Applications page.
- Approve it and confirm it appears in the official Members List.

IMPORTANT
---------
Do not copy the local data/tecump_store.json into production as a substitute for MySQL.
The production source of truth is MySQL.

VALIDATION NOTE
---------------
The source was reviewed after the changes. A full TypeScript/Vite build could not be completed in this environment because the uploaded project did not have its complete root node_modules installation available; this is not a claim that the entire project build passed here.
