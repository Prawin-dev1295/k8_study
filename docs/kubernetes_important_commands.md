# Important Kubernetes Commands and Explanation

This document contains important Kubernetes commands for beginners, especially for a project with:

- React frontend
- Node.js Express backend
- PostgreSQL database
- Kubernetes deployments, services, ingress, configmaps, secrets, PVC, and operator-managed database

---

## 1. Cluster and Node Commands

### Check cluster information

```bash
kubectl cluster-info
```

Shows Kubernetes cluster control plane details.

### Check nodes

```bash
kubectl get nodes
```

Shows worker/master nodes in your cluster.

### Detailed node information

```bash
kubectl describe node <node-name>
```

Use this to check CPU, memory, labels, taints, and node issues.

Example:

```bash
kubectl describe node minikube
```

---

## 2. Namespace Commands

Namespace means a separate space inside Kubernetes.

### Create namespace

```bash
kubectl create namespace order-system
```

### List namespaces

```bash
kubectl get namespaces
```

### Set default namespace

```bash
kubectl config set-context --current --namespace=order-system
```

### Check current namespace

```bash
kubectl config view --minify | grep namespace
```

### Delete namespace

```bash
kubectl delete namespace order-system
```

---

## 3. Pod Commands

### List pods

```bash
kubectl get pods
```

### List pods in a specific namespace

```bash
kubectl get pods -n order-system
```

### List pods with more details

```bash
kubectl get pods -o wide
```

This shows pod IP and which node the pod is running on.

### Describe pod

```bash
kubectl describe pod <pod-name> -n order-system
```

Use this when a pod is not starting, crashing, or stuck in `Pending`.

### Check pod logs

```bash
kubectl logs <pod-name> -n order-system
```

### Follow live logs

```bash
kubectl logs -f <pod-name> -n order-system
```

### Check previous crashed pod logs

```bash
kubectl logs <pod-name> -n order-system --previous
```

### Enter inside pod

```bash
kubectl exec -it <pod-name> -n order-system -- sh
```

For bash:

```bash
kubectl exec -it <pod-name> -n order-system -- bash
```

### Delete pod

```bash
kubectl delete pod <pod-name> -n order-system
```

If the pod is controlled by a Deployment, Kubernetes will recreate it.

---

## 4. Deployment Commands

### List deployments

```bash
kubectl get deployments -n order-system
```

### Create or apply deployment from YAML

```bash
kubectl apply -f backend-deployment.yaml
```

### Apply all files inside a folder

```bash
kubectl apply -f k8s/
```

### Describe deployment

```bash
kubectl describe deployment order-backend -n order-system
```

### Scale deployment

```bash
kubectl scale deployment order-frontend -n order-system --replicas=4
```

```bash
kubectl scale deployment order-backend -n order-system --replicas=3
```

### Restart deployment

```bash
kubectl rollout restart deployment order-backend -n order-system
```

### Check rollout status

```bash
kubectl rollout status deployment order-backend -n order-system
```

### Check rollout history

```bash
kubectl rollout history deployment order-backend -n order-system
```

### Rollback deployment

```bash
kubectl rollout undo deployment order-backend -n order-system
```

### Delete deployment

```bash
kubectl delete deployment order-backend -n order-system
```

---

## 5. Service Commands

### List services

```bash
kubectl get svc -n order-system
```

### Describe service

```bash
kubectl describe svc backend-service -n order-system
```

### Check service endpoints

```bash
kubectl get endpoints -n order-system
```

This is useful to verify whether the Service is correctly connected to pods.

Example:

```bash
kubectl get endpoints backend-service -n order-system
```

### Port-forward service to local machine

```bash
kubectl port-forward svc/backend-service 3000:3000 -n order-system
```

Then access:

```bash
curl http://localhost:3000/api/health
```

---

## 6. Ingress Commands

### List ingress

```bash
kubectl get ingress -n order-system
```

### Describe ingress

```bash
kubectl describe ingress order-ingress -n order-system
```

### Enable ingress in Minikube

```bash
minikube addons enable ingress
```

### Get Minikube IP

```bash
minikube ip
```

Then map domain in `/etc/hosts`:

```bash
<minikube-ip> order-app.local
```

Example:

```bash
192.168.49.2 order-app.local
```

---

## 7. ConfigMap Commands

### List ConfigMaps

```bash
kubectl get configmap -n order-system
```

### Describe ConfigMap

```bash
kubectl describe configmap backend-config -n order-system
```

### Create ConfigMap from command

```bash
kubectl create configmap backend-config \
  --from-literal=DB_HOST=order-postgres-rw \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=orderdb \
  -n order-system
```

### Edit ConfigMap

```bash
kubectl edit configmap backend-config -n order-system
```

After editing ConfigMap, restart deployment:

```bash
kubectl rollout restart deployment order-backend -n order-system
```

---

## 8. Secret Commands

### List Secrets

```bash
kubectl get secrets -n order-system
```

### Describe Secret

```bash
kubectl describe secret postgres-secret -n order-system
```

### Create Secret

```bash
kubectl create secret generic postgres-secret \
  --from-literal=username=orderuser \
  --from-literal=password=StrongPassword123 \
  -n order-system
```

### View Secret value

```bash
kubectl get secret postgres-secret -n order-system -o yaml
```

### Decode Secret value

```bash
kubectl get secret postgres-secret -n order-system \
  -o jsonpath="{.data.password}" | base64 --decode
```

Important: Secrets are base64 encoded, not plain text.

---

## 9. Persistent Volume and PVC Commands

### List PersistentVolumeClaims

```bash
kubectl get pvc -n order-system
```

### List PersistentVolumes

```bash
kubectl get pv
```

### Describe PVC

```bash
kubectl describe pvc <pvc-name> -n order-system
```

Use this when a database pod is stuck in `Pending`.

---

## 10. StatefulSet Commands

Database usually uses StatefulSet or operator-managed StatefulSet.

### List StatefulSets

```bash
kubectl get statefulset -n order-system
```

### Describe StatefulSet

```bash
kubectl describe statefulset <statefulset-name> -n order-system
```

### Scale StatefulSet

```bash
kubectl scale statefulset <statefulset-name> -n order-system --replicas=3
```

For PostgreSQL operator, do not manually scale unless the operator documentation says it is safe. Usually you update the cluster YAML.

---

## 11. CloudNativePG PostgreSQL Commands

### List PostgreSQL clusters

```bash
kubectl get cluster -n order-system
```

### Describe PostgreSQL cluster

```bash
kubectl describe cluster order-postgres -n order-system
```

### List DB pods

```bash
kubectl get pods -n order-system
```

### Check database services

```bash
kubectl get svc -n order-system
```

You may see:

```text
order-postgres-rw
order-postgres-ro
order-postgres-r
```

Meaning:

```text
-rw = read/write service, primary DB
-ro = read-only service, replica DB
-r  = any replica
```

### Check DB pod logs

```bash
kubectl logs <postgres-pod-name> -n order-system
```

### Test failover

```bash
kubectl delete pod <primary-db-pod-name> -n order-system
```

Then check cluster again:

```bash
kubectl get cluster -n order-system
kubectl get pods -n order-system
```

---

## 12. Debugging Commands

### Check all resources in namespace

```bash
kubectl get all -n order-system
```

### Describe problematic pod

```bash
kubectl describe pod <pod-name> -n order-system
```

### Check events

```bash
kubectl get events -n order-system --sort-by=.metadata.creationTimestamp
```

### Check recent warning events

```bash
kubectl get events -n order-system --field-selector type=Warning
```

### Check logs for deployment

```bash
kubectl logs deployment/order-backend -n order-system
```

### Follow deployment logs

```bash
kubectl logs -f deployment/order-backend -n order-system
```

### Check pod resource usage

```bash
kubectl top pods -n order-system
```

### Check node resource usage

```bash
kubectl top nodes
```

Note: `kubectl top` needs Metrics Server.

For Minikube:

```bash
minikube addons enable metrics-server
```

---

## 13. YAML Apply and Delete Commands

### Apply one file

```bash
kubectl apply -f filename.yaml
```

### Apply folder

```bash
kubectl apply -f k8s/
```

### Delete using file

```bash
kubectl delete -f filename.yaml
```

### Delete all resources from folder

```bash
kubectl delete -f k8s/
```

### Dry run before applying

```bash
kubectl apply -f k8s/ --dry-run=client
```

### Validate YAML output

```bash
kubectl apply -f k8s/ --dry-run=client -o yaml
```

---

## 14. Useful Output Formats

### Show wide output

```bash
kubectl get pods -o wide
```

### Show YAML

```bash
kubectl get pod <pod-name> -n order-system -o yaml
```

### Show JSON

```bash
kubectl get pod <pod-name> -n order-system -o json
```

### Get only pod names

```bash
kubectl get pods -n order-system -o name
```

### Get specific value

```bash
kubectl get svc backend-service -n order-system -o jsonpath="{.spec.clusterIP}"
```

---

## 15. Port-Forward Commands

### Access frontend locally

```bash
kubectl port-forward svc/frontend-service 8080:80 -n order-system
```

Open browser:

```text
http://localhost:8080
```

### Access backend locally

```bash
kubectl port-forward svc/backend-service 3000:3000 -n order-system
```

Test health:

```bash
curl http://localhost:3000/api/health
```

### Access PostgreSQL locally

```bash
kubectl port-forward svc/order-postgres-rw 5432:5432 -n order-system
```

Then connect using DBeaver or psql:

```bash
psql -h localhost -p 5432 -U orderuser -d orderdb
```

---

## 16. Image and Rollout Commands

### Update deployment image

```bash
kubectl set image deployment/order-backend \
  backend=my-backend:v2 \
  -n order-system
```

### Check rollout

```bash
kubectl rollout status deployment/order-backend -n order-system
```

### Rollback if issue

```bash
kubectl rollout undo deployment/order-backend -n order-system
```

---

## 17. Most Important Commands for Daily Use

These are the commands you will use most:

```bash
kubectl get pods -n order-system
kubectl get svc -n order-system
kubectl get deployments -n order-system
kubectl get all -n order-system
kubectl describe pod <pod-name> -n order-system
kubectl logs <pod-name> -n order-system
kubectl logs -f deployment/order-backend -n order-system
kubectl exec -it <pod-name> -n order-system -- sh
kubectl apply -f k8s/
kubectl delete -f k8s/
kubectl rollout restart deployment order-backend -n order-system
kubectl rollout status deployment order-backend -n order-system
kubectl get events -n order-system --sort-by=.metadata.creationTimestamp
```

---

## 18. Simple Command Flow for Your Project

```bash
# 1. Create namespace
kubectl create namespace order-system

# 2. Install PostgreSQL operator
kubectl apply --server-side -f https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.27/releases/cnpg-1.27.0.yaml

# 3. Deploy all app resources
kubectl apply -f k8s/

# 4. Check all resources
kubectl get all -n order-system

# 5. Check pods
kubectl get pods -n order-system -o wide

# 6. Check services
kubectl get svc -n order-system

# 7. Check logs
kubectl logs -f deployment/order-backend -n order-system

# 8. Access frontend locally
kubectl port-forward svc/frontend-service 8080:80 -n order-system

# 9. Access backend locally
kubectl port-forward svc/backend-service 3000:3000 -n order-system

# 10. Cleanup
kubectl delete -f k8s/
```

---

## 19. Easy Way to Remember

```text
get          = view resource
describe     = detailed troubleshooting
logs         = check application logs
exec         = enter inside pod
apply        = create/update from YAML
delete       = remove resource
scale        = increase/decrease replicas
rollout      = restart/check/rollback deployment
port-forward = access service locally
```

For beginner to production support, focus mainly on:

```text
get
describe
logs
exec
apply
rollout
events
port-forward
```

---

## 20. Kubernetes Components Quick Meaning

| Component | Meaning |
|---|---|
| Pod | Smallest running unit in Kubernetes |
| Deployment | Manages stateless application pods |
| Service | Gives stable access/load balancing to pods |
| Ingress | Exposes HTTP/HTTPS application to users |
| ConfigMap | Stores normal non-sensitive configuration |
| Secret | Stores sensitive values like password/token |
| PVC | Storage request for pods |
| StatefulSet | Used for stateful apps like database |
| Operator | Automates complex applications like PostgreSQL cluster |
| kube-proxy | Handles Service networking/routing on nodes |

---

## 21. Example Architecture

```text
User Browser
    |
    v
Ingress
    |
    v
Frontend Service
    |
    v
4 React Frontend Pods
    |
    v
Backend Service
    |
    v
3 Express Backend Pods
    |
    v
PostgreSQL Read/Write Service
    |
    v
1 Primary PostgreSQL Pod
    |
    v
2 PostgreSQL Replica Pods
```

---

## 22. Final Summary

For your learning project:

```text
Frontend: React, 4 replicas
Backend: Node.js Express, 3 replicas
Database: PostgreSQL with 3 instances using CloudNativePG operator
```

Main Kubernetes objects used:

```text
Deployment
Service
Ingress
ConfigMap
Secret
PVC
PostgreSQL Operator Cluster
```

Most useful troubleshooting commands:

```bash
kubectl get pods -n order-system
kubectl describe pod <pod-name> -n order-system
kubectl logs <pod-name> -n order-system
kubectl get events -n order-system --sort-by=.metadata.creationTimestamp
kubectl get svc -n order-system
kubectl get endpoints -n order-system
```
