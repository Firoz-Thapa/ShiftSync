# Persistence

User accounts are stored in SQLite at `backend/data/shiftsync-users.db` when running the backend directly. The database is created automatically. Set `ConnectionStrings__Users` or `ConnectionStrings:Users` to change the database location.

Docker Compose stores the user database in the `shiftsync-data` named volume. It survives container rebuilds and `docker compose down`; `docker compose down -v` removes the volume and its account data.

Other application data and email OAuth data are still held in memory and will be lost when the backend restarts. Use a managed persistent database and protected token storage for production deployments.

Team invitations require backend SMTP settings and `InvitationEmail__FrontendBaseUrl`; see the README for the required environment variables. Invitation tokens are random, single-use, expire after 48 hours, and are stored only as SHA-256 hashes. The public acceptance endpoint accepts a token and password, never an email address as proof of identity.
