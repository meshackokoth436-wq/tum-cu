# Leaders Directory Update

Implemented a database-backed member-facing Leaders directory.

## Member experience
- Added **Leaders** to the authenticated dashboard navigation.
- `/dashboard/leaders` lists current active TUMCU leadership appointments.
- Each leader can display a photograph, position, public phone, public email and short bio.
- Clicking a leader opens a responsive profile view with tap-to-call and tap-to-email actions.
- Only active appointments are shown; visibility is controlled by administrators.

## Administration
- Admin Center > Leadership now has a **Public profile** action for each active leader.
- Admin can edit display name, photo, public phone, public email, bio, display order and member visibility.
- Public profile data is intentionally separate from RBAC appointment data, so editing a public profile does not change permissions.
- Leader position/appointment remains controlled by the existing constitutional leadership workflow.

## Database
Migration `007_leadership_public_profiles.sql` creates the persistent public-profile table linked to `leadership_assignments`.

The directory automatically falls back to the leader's existing user name, passport photo, email and phone when a public override has not been configured.
