#!/usr/bin/env bash
# Blue-green deploy of LexVault to Kubernetes.
# Needs: kubectl (KUBECONFIG set) and IMAGE_BACKEND, IMAGE_FRONTEND, IMAGE_TAG in the environment.
#
# Flow: deploy the new backend to the idle colour -> wait ready -> smoke test ->
#       (seed demo data on first run) -> switch the "backend" Service -> roll out the
#       frontend -> end-to-end check. If the end-to-end check fails, traffic is
#       switched back to the previous colour and the script exits non-zero.
set -euo pipefail

NS=lawfirm
K8S=devops/kubernetes/k8s
: "${IMAGE_BACKEND:?IMAGE_BACKEND is required}"
: "${IMAGE_FRONTEND:?IMAGE_FRONTEND is required}"
: "${IMAGE_TAG:?IMAGE_TAG is required}"

kc() { kubectl -n "$NS" "$@"; }

switch_to() {
  kc patch svc backend --type=merge \
    -p "$(printf '{"spec":{"selector":{"app":"lawfirm-backend","version":"%s"}}}' "$1")"
}

echo "== Cluster =="
kubectl get nodes

echo "== Base resources (namespace, Postgres, backend config) =="
kubectl create namespace "$NS" --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f "$K8S/postgres.yaml"
kubectl apply -f "$K8S/backend-config.yaml"
kc rollout status deployment/postgres --timeout=180s

# The backend Service is the blue/green switch: create it once, then only patch it.
kc get svc backend >/dev/null 2>&1 || kubectl apply -f "$K8S/backend-service.yaml"

LIVE=$(kc get svc backend -o jsonpath='{.spec.selector.version}')
if kc get deployment "lawfirm-backend-$LIVE" >/dev/null 2>&1; then
  if [ "$LIVE" = "blue" ]; then TARGET=green; else TARGET=blue; fi
  FIRST_DEPLOY=0
else
  TARGET="$LIVE"   # nothing deployed yet: first release goes to the colour the Service points at
  FIRST_DEPLOY=1
fi
echo "== Live: $LIVE | deploying new version to: $TARGET (first deploy: $FIRST_DEPLOY) =="

echo "== Deploy backend $IMAGE_BACKEND:$IMAGE_TAG to $TARGET =="
sed "s|IMAGE_PLACEHOLDER|$IMAGE_BACKEND:$IMAGE_TAG|" "$K8S/blue-green/backend-$TARGET.yaml" | kubectl apply -f -
if ! kc rollout status "deployment/lawfirm-backend-$TARGET" --timeout=240s; then
  echo "!! $TARGET did not become ready. Live traffic ($LIVE) was NOT touched."
  kc get pods -l "app=lawfirm-backend,version=$TARGET" || true
  exit 1
fi

echo "== Smoke test on $TARGET (before any traffic) =="
ok=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  if kc exec "deploy/lawfirm-backend-$TARGET" -- wget -qO- http://localhost:5000/health; then
    ok=1; echo; break
  fi
  echo "  health check attempt $i failed, retrying..."; sleep 3
done
if [ "$ok" != "1" ]; then
  echo "!! Smoke test failed on $TARGET. Live traffic ($LIVE) was NOT touched."
  exit 1
fi

echo "== Seed demo data if the database is empty =="
USERS=$(kc exec "deploy/lawfirm-backend-$TARGET" -- node -e \
  'const {PrismaClient}=require("@prisma/client");const p=new PrismaClient();p.user.count().then(c=>{console.log(c);process.exit(0)}).catch(()=>process.exit(1))' \
  2>/dev/null | tail -1 || true)
if [ "$USERS" = "0" ]; then
  kc exec "deploy/lawfirm-backend-$TARGET" -- node src/prisma/seed.js
else
  echo "  users in database: ${USERS:-unknown} - skipping seed"
fi

echo "== Switch traffic: $LIVE -> $TARGET =="
switch_to "$TARGET"

echo "== Deploy frontend $IMAGE_FRONTEND:$IMAGE_TAG =="
sed "s|IMAGE_PLACEHOLDER|$IMAGE_FRONTEND:$IMAGE_TAG|" "$K8S/frontend-deployment.yaml" | kubectl apply -f -
if ! kc rollout status deployment/lawfirm-frontend --timeout=240s; then
  echo "!! Frontend rollout failed - rolling back."
  kc rollout undo deployment/lawfirm-frontend || true
  [ "$FIRST_DEPLOY" = "0" ] && switch_to "$LIVE"
  exit 1
fi

echo "== End-to-end check (frontend pod -> backend Service) =="
e2e=0
for i in 1 2 3 4 5; do
  if kc exec deploy/lawfirm-frontend -- wget -qO- http://127.0.0.1/health >/dev/null \
     && kc exec deploy/lawfirm-frontend -- wget -qO- http://backend:5000/health; then
    e2e=1; echo; break
  fi
  echo "  attempt $i failed, retrying..."; sleep 3
done
if [ "$e2e" != "1" ]; then
  echo "!! End-to-end check failed."
  if [ "$FIRST_DEPLOY" = "0" ]; then
    echo "!! Rolling traffic back to $LIVE"
    switch_to "$LIVE"
  fi
  exit 1
fi

echo "== Monitoring (Prometheus + Grafana, non-blocking) =="
# Never fails the deploy: the app is already live at this point.
if kubectl apply -f devops/kubernetes/monitoring/monitoring.yaml; then
  kubectl -n monitoring rollout restart deploy/prometheus >/dev/null 2>&1 || true
  echo "Monitoring applied. Images may still be pulling: kubectl -n monitoring get pods"
else
  echo "WARNING: monitoring apply failed (app deploy is unaffected)"
fi

echo "== Done =="
echo "Live backend colour : $TARGET ($LIVE is now standby; rollback = patch the backend Service selector back)"
kc get pods -o wide
echo "App URL (kind)      : http://localhost:30080"
