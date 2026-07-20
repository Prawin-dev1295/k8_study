# Order Purchase Kubernetes Learning Project

This project is a complete Order Purchasing System for learning Docker and Kubernetes with a React frontend, Node.js/Express backend, and a replicated PostgreSQL database managed by CloudNativePG.

## 1. Project Overview

Users can view products, add products to an order, enter a customer name, submit the order, and view submitted orders. The data is stored in PostgreSQL.

Kubernetes target state:

- Frontend: 4 React/Nginx pods
- Backend: 3 Express API pods
- Database: 3 PostgreSQL instances through CloudNativePG, with one primary and two replicas

## 2. Architecture Diagram

```text
Browser
  |
  | http://order.local
  v
Kubernetes Ingress
  |
  v
order-frontend Service
  |
  v
4 x order-frontend Pods
  |  Nginx serves React and proxies /api
  v
order-backend Service
  |
  v
3 x order-backend Pods
  |
  | DB_HOST=order-postgres-rw
  v
CloudNativePG order-postgres Cluster
  |
  +-- primary PostgreSQL instance
  +-- replica PostgreSQL instance
  +-- replica PostgreSQL instance
```

## 3. Technology Stack

- React and Vite for the frontend
- Nginx for serving the frontend container
- Node.js and Express.js for the REST API
- PostgreSQL for storage
- CloudNativePG operator for PostgreSQL replication and failover
- Kubernetes Deployments, Services, Secrets, PVCs, and Ingress

## 4. Folder Structure

```text
order-purchase-k8s/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.html
│   ├── src/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   └── db.js
├── k8s/
│   ├── namespace.yaml
│   ├── frontend-deployment.yaml
│   ├── frontend-service.yaml
│   ├── backend-configmap.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   ├── postgres-secret.yaml
│   ├── postgres-cluster.yaml
│   └── ingress.yaml
└── README.md
```

## 5. Prerequisites

- Docker
- Node.js 20 or newer
- kubectl
- minikube or kind
- CloudNativePG operator installed in the cluster

## 6. Local Development Setup

Start a local PostgreSQL container with Docker Compose:

```bash
docker compose up -d order-postgres-local
```

This maps PostgreSQL to `localhost:5433` to avoid conflicts with any PostgreSQL already running on your Mac.

Run the backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Run the frontend in another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## 7. Docker Build Commands

For local Docker:

```bash
docker build -t order-backend:latest ./backend
docker build -t order-frontend:latest ./frontend
```

For minikube, build inside the minikube Docker daemon:

```bash
eval $(minikube docker-env)
docker build -t order-backend:latest ./backend
docker build -t order-frontend:latest ./frontend
```

For kind, load local images after building:

```bash
kind load docker-image order-backend:latest
kind load docker-image order-frontend:latest
```

## 8. Kubernetes Setup Commands

Create or start a cluster:

```bash
minikube start
minikube addons enable ingress
```

Create the namespace:

```bash
kubectl create namespace order-system
```

The repository also includes `k8s/namespace.yaml`, so `kubectl apply -f k8s/namespace.yaml` is also valid.

## 9. CloudNativePG Operator Installation

Install CloudNativePG 1.27:

```bash
kubectl apply --server-side -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.27/releases/cnpg-1.27.0.yaml
```

Check the operator:

```bash
kubectl get pods -n cnpg-system
```

## 10. PostgreSQL Cluster Deployment

Apply the database secret and cluster:

```bash
kubectl apply -f k8s/postgres-secret.yaml
kubectl apply -f k8s/postgres-cluster.yaml
```

CloudNativePG creates the `order-postgres-rw` read/write service that the backend uses.

## 11. Frontend and Backend Deployment

Apply all manifests:

```bash
kubectl apply -f k8s/
```

If the namespace already exists, the namespace manifest will be unchanged.

## 12. Verify Pods, Services, Deployments, PVCs, and Cluster

```bash
kubectl get pods -n order-system
kubectl get deployments -n order-system
kubectl get svc -n order-system
kubectl get pvc -n order-system
kubectl get cluster -n order-system
kubectl get ingress -n order-system
```

Expected replicas:

```bash
kubectl get deployment order-frontend -n order-system
kubectl get deployment order-backend -n order-system
kubectl get cluster order-postgres -n order-system
```

## 13. Check Logs

```bash
kubectl logs -n order-system deployment/order-backend
kubectl logs -n order-system deployment/order-frontend
```

The original short examples are often written as `deployment/backend` and `deployment/frontend`; this project uses the explicit names `deployment/order-backend` and `deployment/order-frontend`.

## 14. Scale Frontend and Backend

```bash
kubectl scale deployment order-frontend -n order-system --replicas=4
kubectl scale deployment order-backend -n order-system --replicas=3
```

Verify:

```bash
kubectl get pods -n order-system -l app=order-frontend
kubectl get pods -n order-system -l app=order-backend
```

## 15. Test the API

Port-forward the backend service:

```bash
kubectl port-forward -n order-system svc/order-backend 5000:5000
```

Test health:

```bash
curl http://localhost:5000/api/health
```

Test products:

```bash
curl http://localhost:5000/api/products
```

Create an order:

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Haritha","items":[{"productId":1,"quantity":2},{"productId":2,"quantity":1}]}'
```

View orders:

```bash
curl http://localhost:5000/api/orders
```

## 16. How the Frontend Connects to the Backend

The frontend reads `API_BASE_URL` at container startup and writes it to `/usr/share/nginx/html/config.js`. In Kubernetes, `frontend-deployment.yaml` sets:

```text
API_BASE_URL=/api
```

The browser calls `/api`, and the frontend Nginx container proxies those requests to:

```text
http://order-backend:5000/api/
```

`order-backend` is the Kubernetes Service name for the backend pods.

## 17. How the Backend Connects to PostgreSQL

The backend reads these environment variables:

```text
DB_HOST=order-postgres-rw
DB_PORT=5432
DB_NAME=orderdb
DB_USER from Kubernetes Secret
DB_PASSWORD from Kubernetes Secret
```

`order-postgres-rw` is the CloudNativePG read/write service for the current primary database instance.

## 18. How the 3 Database Instances Work

`postgres-cluster.yaml` sets:

```yaml
instances: 3
```

CloudNativePG creates three PostgreSQL pods. One pod is the primary and accepts writes. The other two are replicas that continuously receive changes from the primary. If the primary fails, CloudNativePG promotes a healthy replica and updates the `order-postgres-rw` service so the backend keeps using the same DNS name.

Each database instance gets persistent storage through its own PVC.

## 19. Test Database Failover

Find the current primary:

```bash
kubectl get pods -n order-system -l cnpg.io/cluster=order-postgres
kubectl get cluster order-postgres -n order-system -o yaml
```

Delete one PostgreSQL pod to simulate failure:

```bash
kubectl delete pod <postgres-pod-name> -n order-system
```

Then watch recovery:

```bash
kubectl get pods -n order-system -w
kubectl get cluster order-postgres -n order-system
```

If you delete the primary pod, CloudNativePG promotes a replica. The backend continues connecting to `order-postgres-rw`.

## 20. Access the Frontend

For minikube ingress, get the minikube IP:

```bash
minikube ip
```

Add a hosts entry:

```text
<minikube-ip> order.local
```

Then open:

```text
http://order.local
```

Alternative port-forward access:

```bash
kubectl port-forward -n order-system svc/order-frontend 8080:80
```

Open `http://localhost:8080`.

## 21. Cleanup Commands

Delete the application:

```bash
kubectl delete -f k8s/
```

Delete the namespace:

```bash
kubectl delete namespace order-system
```

Delete the CloudNativePG operator:

```bash
kubectl delete -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.27/releases/cnpg-1.27.0.yaml
```

Stop local development PostgreSQL:

```bash
docker compose down
```

Stop local development PostgreSQL and delete its saved database volume:

```bash
docker compose down -v
```

## Notes

- Non-sensitive backend settings are stored in `backend-configmap.yaml`.
- Database passwords are not hardcoded in application code. Kubernetes uses `postgres-secret.yaml`.
- The backend automatically creates `products`, `orders`, and `order_items` tables on startup.
- Default product data is inserted only when the `products` table is empty.
- Frontend and backend deployments include readiness and liveness probes.
- The manifests are designed to run on minikube or kind after local images are available in the cluster.
