# Persistence Plan

The current backend keeps development data in static in-memory collections. This is acceptable for local API contract work, but it should not be used for production or multi-user testing.

Recommended next step:

1. Add Entity Framework Core with a relational database provider.
2. Create entities for users, workplaces, shifts, study sessions, email accounts, and email messages.
3. Replace controller static lists with scoped repository or DbContext access.
4. Add migrations and seed data for local development.
5. Store OAuth tokens encrypted or in a managed secret store, not in plain database columns.

Until that work lands, data will reset whenever the backend process restarts.
