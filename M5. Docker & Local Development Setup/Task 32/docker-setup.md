# Setting Up Docker and Docker Compose

# Install Docker & Docker Compose

## Windows 10/11

- Install **Docker Desktop**: download from docker.com and run the installer.
- Enable **WSL 2** (the installer can do this) and reboot if prompted.
- Compose v2 is included; you’ll use `docker compose` (no hyphen).

**Verify**

```powershell
docker --version
docker compose version
docker run --rm hello-world

```

## macOS (Intel & Apple Silicon)

- Install **Docker Desktop for Mac** (DMG). Grant permissions when asked.
- Compose v2 is included.

**Verify**

```bash
docker --version
docker compose version
docker run --rm hello-world

```

## Ubuntu / Debian (Linux)

```bash
# 1) Prereqs
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg

# 2) Add Docker’s official GPG key & repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release; echo $VERSION_CODENAME) stable" \
| sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3) Install Engine + Compose plugin
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4) Start & enable
sudo systemctl enable --now docker

# (optional) Run docker without sudo after re-login
sudo usermod -aG docker $USER

```

**Verify**

```bash
docker --version
docker compose version
docker run --rm hello-world
systemctl status docker   # service status

```

> Fedora/CentOS/RHEL are similar (use dnf/yum and Docker’s repo), then systemctl enable --now docker.
> 

---

# Verify Docker & Check Running Services

```bash
docker info                       # daemon + system info
docker ps                         # running containers
docker ps -a                      # all containers
systemctl status docker           # Linux service status

```

---

# Key Docker Commands (quick cheat sheet)

```bash
docker pull <image>               # get image
docker images                     # list images
docker run -d --name web -p 8080:80 nginx:latest  # run a container
docker ps                         # list running
docker logs -f web                # tail logs
docker exec -it web /bin/sh       # enter container
docker stop web                   # stop container
docker start web                  # start stopped container
docker rm web                     # remove container
docker rmi <image>                # remove image
docker inspect web                # detailed info (env, mounts, networks)
docker network ls                 # networks
docker volume ls                  # volumes

```

---

# Docker Compose: multi-container made simple

**Example `docker-compose.yml`**

```yaml
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
      retries: 10
    ports:
      - "5432:5432"

  api:
    build: ./api
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "3000:3000"

volumes:
  pgdata: {}

```

**Common Compose commands**

```bash
docker compose up -d                # start all
docker compose down                 # stop & remove (keeps volumes)
docker compose down --volumes       # ⚠ wipes volumes/data
docker compose logs -f api          # follow logs for a service
docker compose restart api          # restart one service
docker compose up -d --build api    # rebuild just api

```

## Reflection

1. Difference between docker run and docker compose up?
- The docker run command operates as an imperative tool for starting individual containers through port assignments and environment variables and volume mounts.
- Docker compose up functions as a declarative tool which uses YAML files to deploy services and networks and volumes in a repeatable manner with version control capabilities.
- docker run: one-off, imperative command to start a single container with flags (ports, env, mounts).
- docker compose up: declarative; reads a YAML file to bring up one or many services, networks, and volumes together—repeatable and version-controlled.
1. How does Docker Compose help with multiple services?
- A single file contains all configuration settings for multiple services.
- The entire stack comprising DB and API and frontend and cache becomes operational through a single command execution.
- Each service receives DNS access through name references (e.g., db) and the tool handles dependencies between services along with health checks.
- The tool enables better management of environment variables through env_file while streamlining rebuilds and logs and environments.
- Centralizes config for all services in one file.
- The command allows you to start the complete stack of DB and API and frontend and cache with one operation.
- Service dependencies and health checks receive automatic management and each service obtains DNS accessibility through named references (e.g., db).
- The tool enables better management of rebuilds and logs and environment files through its env_file feature.
1. Commands to check logs from a running container?
- Users can monitor container logs using docker logs -f --tail=200 <container> while adding optional flags such as --since=10m or --timestamps.
- Users can check service logs with docker compose logs -f <service> while adding the --since=1h option for logging since the last hour.
- Single container: docker logs -f --tail=200 <container> (add --since=10m or --timestamps).
- Users can access service logs with docker compose logs -f <service> by adding the optional --since=1h flag.
1. What happens when you restart a container? Does data persist?
- Running docker restart <container> will halt then restart the original container and maintain the writable layer data but discard all in-memory information.
- Named volumes along with bind mounts continue to store data after restarts and when they are re-created.
- Data disappears when you depend solely on container internal file systems yet remove the container or perform docker compose down --volumes to delete volumes.
- The docker restart <container> command halts the container before restarting it from the same state but keeps the container's writable layer intact while discarding in-memory data.
- Named volumes together with bind mounts maintain their data throughout container restarts and re-creation processes.
- All data disappears when you depend solely on container internal filesystems and remove the container or execute docker compose down --volumes which removes volumes.