# Running PostgreSQL in Docker

# Run PostgreSQL with Docker

## 1) Quick start (single `docker run`)

```bash
# Pull and run Postgres 16 with a named volume
docker volume create pgdata
docker run -d --name pg \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=secretpass \
  -e POSTGRES_DB=appdb \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  postgres:16

```

Verify:

```bash
docker ps
docker logs -f pg

```

---

## 2) docker-compose.yml (recommended)

Create `docker-compose.yml`:

```yaml
services:
  db:
    image: postgres:16
    container_name: pg
    restart: unless-stopped
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secretpass
      POSTGRES_DB: appdb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 15

  # Optional: pgAdmin UI (web client)
  pgadmin:
    image: dpage/pgadmin4:8
    restart: unless-stopped
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@example.com
      PGADMIN_DEFAULT_PASSWORD: adminpass
    ports:
      - "5050:80"
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata: {}

```

Bring it up:

```bash
docker compose up -d
docker compose ps

```

Optional `.env` (so you don’t hardcode secrets):

```
POSTGRES_USER=appuser
POSTGRES_PASSWORD=secretpass
POSTGRES_DB=appdb
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=adminpass

```

Then reference with `env_file: .env` under each service.

---

## 3) Connect to PostgreSQL

### a) From your host (psql)

```bash
psql "postgresql://appuser:secretpass@localhost:5432/appdb"
# or
psql -h localhost -p 5432 -U appuser -d appdb

```

### b) From inside the container (psql)

```bash
docker exec -it pg psql -U appuser -d appdb

```

### c) From pgAdmin (browser UI)

1. Open [http://localhost:5050](http://localhost:5050/)
2. Login with `admin@example.com` / `adminpass`.
3. Add a new server:
    - Name: `Local PG`
    - Host: `db` (service name if connecting from pgAdmin container) or `host.docker.internal` / `localhost` if pgAdmin runs on your host
    - Port: `5432`
    - Username: `appuser`, Password: `secretpass`
4. Save → connect.

### d) From a Node/NestJS app

Connection URL (TypeORM/Prisma/etc.):

```
DATABASE_URL=postgresql://appuser:secretpass@db:5432/appdb

```

Note: use **`db`** (the Compose service name) as the host when containers talk to each other.

---

## 4) Persist data with volumes

- The line `pgdata:/var/lib/postgresql/data` mounts a **named volume** where Postgres stores its data directory.
- This survives container restarts and even `docker compose up --build` recreations.
- You only lose data if you remove the volume:
    
    ```bash
    docker compose down --volumes   # ⚠ deletes pgdata
    docker volume rm pgdata         # ⚠ deletes pgdata
    
    ```
    
- Inspect and see it’s there:
    
    ```bash
    docker volume ls
    docker volume inspect pgdata
    
    ```
    

---

## Useful commands

```bash
# Status & logs
docker compose ps
docker compose logs -f db

# Restart DB without data loss
docker compose restart db

# Rebuild app only (keep DB volume)
docker compose up -d --no-deps --build app

# One-off psql command
docker exec -it pg psql -U appuser -d appdb -c "\dt"

# Create a backup (from host)
docker exec -t pg pg_dump -U appuser -d appdb > backup.sql

# Restore a backup
cat backup.sql | docker exec -i pg psql -U appuser -d appdb

```

## Reflection

1. Running PostgreSQL inside Docker containers provides users with several advantages.
- The same version and configuration of PostgreSQL exists consistently across all machines.
- The isolation feature protects the host system from contamination while enabling smooth upgrades and rollbacks.
- The lifecycle management of the application becomes straightforward through Compose because it supports up, down, restart and healthcheck operations.
- The shared network enables users to run their DB alongside app and cache and other services.
- The use of Docker volumes enables developers to maintain consistent development and production environments which reduces the occurrence of "works on my machine" problems.
1. Docker volumes enable PostgreSQL data persistence through which mechanism?
- The Postgres data directory exists outside the container's writable layer when stored in volumes.
- The volume remains unaffected when you recreate or update the container because of this setup.
- The data will get deleted only when you perform explicit volume removal or use the down --volumes command.
1. What methods exist to establish connections with an operating PostgreSQL container?
- The PostgreSQL connection string for host psql looks like this: "postgresql://appuser:secretpass@localhost:5432/appdb".
- The psql command inside the container uses the following syntax: docker exec -it pg psql -U appuser -d appdb.
- The connection to pgAdmin requires starting dpage/pgadmin4 followed by establishing a link through either the host db (in Compose) or localhost from the host.
- The service name db functions as the host address in your connection URL for applications running within Compose.