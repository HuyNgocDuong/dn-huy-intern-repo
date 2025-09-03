# Debugging & Managing Docker Containers

# Inspect running containers

**List containers:**

The `docker ps` command displays active processes when you run it while `docker ps -a` shows all containers including exited ones and `docker ps --filter "name=api"` lets you search by name. The `docker ps` command displays output in table format when you use the `--format "table {{.Names}}\t{{.Image}}\t{{.Status}}"` option.

The command `docker inspect <container>` shows detailed information about the environment as well as mounts and network configurations and IP addresses and health status and entrypoint and more.

You can check container details by running:

```bash
docker inspect <container>
docker inspect --format '{{.NetworkSettings.IPAddress}}' <container>
docker inspect --format '{{json .Mounts}}' <container> | jq
docker inspect --format '{{json .State.Health}}' <container> | jq

```

Inspect the following essential elements in a container: **State, Mounts, Config.Env, HostConfig.PortBindings, NetworkSettings.Networks.**

---

# View the log data from a running container

```bash
docker logs <container>          # entire buffer
docker logs -f <container>       # follow (tail -f)
docker logs -f --tail=100 <ctr>  # follow last 100 lines
docker logs --since=10m <ctr>    # last 10 minutes
docker logs --timestamps <ctr>   # add timestamps

```

**With Compose:**

```bash
docker compose logs <service>
docker compose logs -f <service> --since=1h
docker compose logs -f --tail=200

```

**Log filtering:**

```bash
docker logs -f <ctr> 2>&1 | grep -i "error\|warn"

```

---

# Enter a running container (interactive shell)

You can access Debian/Ubuntu images through:

```bash
docker exec -it <container> /bin/bash

```

and Alpine/BusyBox images through:

```bash
docker exec -it <container> /bin/sh

```

**Run a single command without a shell:**

```bash
docker exec <container> node -v
docker exec <container> env | sort
docker exec <db> psql -U postgres -c '\l'
docker exec <db> mysql -uroot -p'<pwd>' -e 'SHOW DATABASES;'

```

---

# Stop, remove, restart, and rebuild containers

**Stop / remove:**

```bash
docker stop <container>
docker rm <container>
docker rm -f <container>       # force remove
docker container prune         # remove stopped containers

```

**Restart:**

```bash
docker restart <container>

```

**Rebuild image + recreate container (Compose):**

```bash
docker compose build <service>
docker compose up -d --no-deps --build <service>
docker compose up -d --build   # all services

```

**Stack destruction:**

```bash
docker compose down
docker compose down --volumes   # DATA LOSS
docker compose down --rmi local

```

Use **named volumes** for data protection and only run `down --volumes` if you want to erase data.

---

# Example `docker-compose.yml` (data-safe + healthcheck)

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 10

  app:
    build: ./app
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"

volumes:
  pgdata: {}   # named volume persists across restarts/recreates

```

---

# Reflection (docker-debugging.md)

**1) What steps do you need to follow to view logs from an active container?**

Use `docker logs` (or Compose logs):

- `docker logs -f --tail=200 <container>` – view live logs with tail.
- `docker compose logs -f --since=30m <service>` – view logs in Compose for the last 30 minutes.

Add timestamps with `--timestamps` and filter using `grep`.

---

**2) What are the main differences between docker exec and docker attach?**

- `exec`: Creates a **new process** inside the running container, independent of the main process (e.g., open a shell). Multiple exec sessions can run at once.
- `attach`: Connects your terminal to the container’s **main process** (PID 1). If you press `Ctrl+C`, you might interrupt or stop it. Use carefully.

---

**3) What actions should I take to restart a container without damaging its stored information?**

- Keep data in **named volumes** or external storage instead of inside the container filesystem.
- Restart safely:
    
    ```bash
    docker restart <container>
    docker compose up -d --no-deps --build <service>
    
    ```
    
- Avoid `docker compose down --volumes` unless you intend to wipe all data.
- Ensure your `docker-compose.yml` defines named volumes like `pgdata`.

---

**4) Which steps can help diagnose connection problems when your database runs inside a NestJS application in Docker containers?**

**Checklist:**

- **Environment & URLs**: Check DB env vars inside app container:
    
    ```bash
    docker exec <app> env | grep -E 'DATABASE|POSTGRES|MYSQL'
    
    ```
    
    Use service name as host (e.g., `db`, not `localhost`).
    
- **Network & Ports**: Ensure containers share the same Docker network. Test from app container:
    
    ```bash
    docker exec -it <app> sh -lc 'nc -vz db 5432'
    
    ```
    
- **Database health & auth**: Confirm DB is healthy and credentials exist:
    
    ```bash
    docker exec -it <db> psql -U postgres -c '\du'
    docker exec -it <db> psql -U postgres -c '\l'
    
    ```
    
- **Server bind & listen**: DB must listen on `0.0.0.0`.
- **ORM config**: For TypeORM or Prisma, confirm `DATABASE_URL`. Add retry logic for DB readiness.
- **Logs**: Check app logs with `docker compose logs -f app` and DB logs with `docker compose logs -f db`.
- **Common errors**:
    - `ECONNREFUSED`: DB not ready or wrong host/port.
    - `ETIMEDOUT`: network/firewall issue.
    - Auth failed: wrong credentials.
- **Migrations**: Run with one-off exec:
    
    ```bash
    docker compose run --rm app npx prisma migrate deploy
    
    ```
    
- **Rebuild safely**:
    
    ```bash
    docker compose up -d --no-deps --build app
    
    ```
    

---

# Handy one-liners

```bash
# Find container by partial name and tail logs
docker logs -f $(docker ps --format '{{.Names}}' | grep api)

# Show container env in a table
docker inspect --format '{{range .Config.Env}}{{printf "%s\n" .}}{{end}}' <ctr> | sort

# Enter a node container and run a script
docker exec -it <app> node -e "console.log(process.env.DATABASE_URL)"

```