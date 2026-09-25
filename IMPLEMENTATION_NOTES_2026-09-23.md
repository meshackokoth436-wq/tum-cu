# TECUMP implementation update — 23 September 2026

## Authentication
- Removed Firebase from the application authentication flow.
- Login now uses only the TECUMP backend JWT + refresh-token model.
- Removed the Google/Firebase login fallback and the Super Admin Firebase credential-sync UI.
- Removed the backend Firebase-login endpoint and Firebase-token decoding fallback from the authentication middleware.
- Existing registration approval remains authoritative: new accounts are created as `pending_approval` and cannot bypass approval through an alternate provider.
- Existing refresh-token rotation, lockout and `/auth/me` revalidation remain in place.

## E-Library
- TECUMP now exposes only digital resources in the catalogue.
- Physical books are no longer represented as library inventory, copies, shelves, ISBNs, reservations or physical resource records in the public portal.
- Added a dedicated `library_physical_loans` table for the lending register.
- Librarian lending flow: type book title -> search approved member -> auto-filled member details -> choose due date -> record loan.
- Added return recording and calculated statuses: ACTIVE, DUE_SOON, OVERDUE, RETURNED.
- Simplified member library UI and librarian dashboard.

## E-Teams
Authoritative public names are now:
1. NET MINISTRIES TRUST TUM UNIT
2. NORET-SORET

- E-Team API queries now match migration 005 column names (`team_id`, `scheduled_date`, `time_slot`, `published_at`, `event_date`, `activity_date`, etc.).
- Added database-scoped `e_team` RBAC scope.
- Added generic `e_team_chairperson` role and scoped appointment workflow.
- Removed hardcoded NORET/SORET chairperson authorization checks.
- Chairpersons can manage only their assigned team; Super Admin retains global technical access.
- Added migration 006 for the database cleanup and structural E-Team records.

## Validation
- Dependency installation could not be completed in this execution environment because the package registry install timed out.
- A TypeScript transpilation/syntax pass was completed successfully for all modified frontend/backend TypeScript files.
- Full `npm run lint`, backend typecheck, production build and MySQL migration execution still need to be run in the project's normal development/deployment environment where dependencies and the MySQL server are available.
