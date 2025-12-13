#!/bin/bash
# CPU/Memory monitoring script for backend pods

echo "=== Node Resources ==="
kubectl top nodes

echo -e "\n=== Backend Pods ==="
kubectl top pods -l app=backend

echo -e "\n=== Pod Status ==="
kubectl get pods -l app=backend

echo -e "\n=== Resource Limits vs Usage ==="
kubectl describe pods -l app=backend | grep -A 10 "Limits:\|Requests:"