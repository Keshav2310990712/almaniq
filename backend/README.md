# Scheduling Backend (Simple Layered Architecture)

Flow:

`route -> controller -> service -> repository -> db`

Responsibilities:

- routes: endpoint mapping only, no business logic
- controllers: request/response handling, call services
- services: business rules and orchestration
- repositories: database access and SQL
- lib: shared helpers (errors, validators, date helpers, response shape)
- db: PostgreSQL pool, migrations, seed scripts
