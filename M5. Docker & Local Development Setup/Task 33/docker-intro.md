# What is Docker and Why Use It?

Docker introduction (backend developers)

**What is Docker**

- Docker bundles an app and all its dependencies into a container image.
- A container runs as a single, isolated process on the host, with the host kernel shared (no entire guest OS).

**How Docker differs from virtual machines**

- Kernel: Containers share the host kernel; VMs run a full guest OS with its own kernel.
- Footprint: Containers are small (MBs), boot in seconds; VMs are larger (GBs), boot in minutes.
- Density: You can support many more containers than VMs per host.
- Immutability: Images are layered, content-addressed, simple to rebuild and roll back.
- Use cases: Containers are best for microservices, CI pipelines, reproducible dev envs; VMs are best when you need OS-level isolation between OSes or if you want a different kernel.

**Advantages in a backend environment**

- Reproducible builds: Image determines OS libs + runtime versions (Node, Python, Java, OpenSSL).
- Consistent envs: Same image in dev/CI/staging/prod → less "works on my machine" bugs.
- Fast onboarding: docker compose up spins up DBs, caches, queues, mail sinks, etc.
- Service isolation: Services pin different versions safely (e.g., Node 20 vs 22).
- Easy rollback: Swap image tags to roll back quickly.
- Infra as code: Compose file is living documentation for the stack.

**How containers keep things consistent**

- Image pinning (e.g., node:20-alpine, postgres:16).
- Locked package versions (lockfiles baked into the image).
- Single entry point per service with env vars transmitted from .env.
- Same compose file across everywhere with secrets/URLs different based on environment.

# “Focus Bear–style” backend with Docker (example)

> Assuming a NestJS API, a worker, Postgres, Redis, and ephemeral migrations. Adjust names/commands to your repo.
> 

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: appdb
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 20
    ports:
      - "5432:5432"

  redis:
    image: redis:7
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 20
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: Dockerfile
    env_file: .env
    command: npm run start:dev     # or start:prod in production
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }
    ports:
      - "3000:3000"
    volumes:
      - ./:/app                     # dev hot-reload (remove in prod)
      - /app/node_modules

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    env_file: .env
    command: npm run worker         # e.g., BullMQ / queue processor
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_healthy }

  migrate:
    build:
      context: .
      dockerfile: Dockerfile
    env_file: .env
    command: npm run migration:run  # or `npx prisma migrate deploy`
    depends_on:
      db: { condition: service_healthy }
    restart: "no"

volumes:
  pgdata: {}
  redisdata: {}

```

**Dockerfile (Node/NestJS multi-stage)**

```docker
# Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3000
CMD ["node", "dist/main.js"]

```

**Typical `.env`**

```
DATABASE_URL=postgresql://appuser:secret@db:5432/appdb
REDIS_URL=redis://redis:6379
PORT=3000
NODE_ENV=development

```

**Day-to-day**

- Initial stack build: docker compose up -d
- See logs: docker compose logs -f api (or db, worker)
- Run migrations: docker compose run --rm migrate
- Rebuild API alone: docker compose up -d --no-deps --build api
- Save data: do not do down --volumes unless you want to delete.

**Possible drawbacks / gotchas**

- Steep learning curve: images, layers, networking, volumes, healthchecks.
- Host performance: Docker on macOS/Windows employs a light VM; high I/O (bind mounts) may be slower than native Linux.
- Storage bloating: stacked-up old images/volumes → use docker system prune.
- Networking gotchas: localhost within a container ≠ host; use service names (db) or host.docker.internal (host access).
- Permissions: UID/GID mismatch when writing to bind-mounted volumes.
- Security: rootful containers, older base images—keep images patched and least-privilege.

✅ **Reflection (docker-intro.md)**

**How is Docker different from a virtual machine?**

- Containers share the host kernel and are process-level isolated; VMs execute a full guest OS with its own kernel. Containers are quicker to boot, consume less resource, and are simpler to rebuild/ship; VMs provide more isolation and OS-level flexibility.

**Why is containerization useful for a backend like Focus Bear's?**

- Boots the entire stack (API, worker, Postgres, Redis) with a single command, resolves version pins, makes reproducible local/CI/prod behavior possible, makes onboarding faster, makes rollbacks easy, and makes horizontal scaling (additional API/worker replicas) easy.

**How does Docker assist in managing dependencies?**

- The image holds system libs and runtimes; the lockfile settles app deps; Compose connects service endpoints by using DNS. All environments execute the same bits, which removes drift.

**What are some of the limitations of Docker?**

- Additional complexity (images/layers/networks), host-performance overhead on non-Linux environments, disk-space growth without trimming, UID/GID and file-watcher weasels with bind mounts, and the requirement to make base images and secrets secure.