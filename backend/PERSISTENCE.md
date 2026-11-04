# Persistence

User accounts are stored in SQLite at `backend/data/shiftsync-users.db` when running the backend directly. The database is created automatically. Set `ConnectionStrings__Users` or `ConnectionStrings:Users` to change the database location.

Docker Compose stores the user database in the `shiftsync-data` named volume. It survives container rebuilds and `docker compose down`; `docker compose down -v` removes the volume and its account data.

Other application data and email OAuth data are still held in memory and will be lost when the backend restarts. Use a managed persistent database and protected token storage for production deployments.
