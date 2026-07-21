# Running the Application with Docker Compose

This Docker Compose setup starts the complete application:

- PostgreSQL database
- Node.js/Express backend
- React/Nginx frontend

## Prerequisite

Install Docker Desktop and make sure Docker is running.

Verify Docker and Docker Compose:

```bash
docker --version
docker compose version
```

## 1. Open the Project Directory

```bash
cd /Users/prawin/Music/Haritha/Learn_Haritha/kube_test/purchasing/order-purchase-k8s
```

## 2. Build and Start the Application

```bash
docker compose up --build -d
```

This command builds the frontend and backend images and starts all three
containers in the background.

## 3. Check the Containers

```bash
docker compose ps
```

The PostgreSQL and backend services should show as healthy, and the frontend
service should show as running.

## 4. Open the Application

Open the following address in a browser:

```text
http://localhost:8080
```

You can add products to an order, enter a customer name, submit the order, and
view submitted orders.

## 5. Test the Backend API

Test the backend health endpoint directly:

```bash
curl http://localhost:5001/api/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

Get the available products:

```bash
curl http://localhost:5001/api/products
```

Test the API through the frontend Nginx proxy:

```bash
curl http://localhost:8080/api/health
```

## 6. View Logs

View logs from all services:

```bash
docker compose logs -f
```

View logs from an individual service:

```bash
docker compose logs -f order-backend
docker compose logs -f order-frontend
docker compose logs -f order-postgres-local
```

Press `Ctrl+C` to stop following the logs. The containers will continue to
run in the background.

## 7. Restart the Application

```bash
docker compose restart
```

## 8. Stop the Application

Stop and remove the containers and Docker network:

```bash
docker compose down
```

The PostgreSQL data remains in its Docker volume, so saved orders are retained
the next time the application starts.

## 9. Stop the Application and Delete Database Data

```bash
docker compose down -v
```

Use the `-v` option only when you intentionally want to delete all stored
orders and reset the database.

## Troubleshooting

Check all container statuses:

```bash
docker compose ps -a
```

Rebuild the application after changing source code:

```bash
docker compose up --build -d
```

If ports `8080`, `5001`, or `5433` are already being used, stop the process or
container using that port before starting this application.
