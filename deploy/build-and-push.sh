#!/bin/bash
set -e

# Get commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
REGISTRY="splkm97"

echo "Building images with tag: ${COMMIT_HASH}"

# Build backend
echo "Building backend..."
docker buildx build \
  --platform linux/amd64 \
  -f deploy/docker/Dockerfile.backend \
  -t ${REGISTRY}/trading-wizard-backend:${COMMIT_HASH} \
  -t ${REGISTRY}/trading-wizard-backend:latest \
  --push \
  .

# Build frontend apps
for APP in portal daily-focus my-portfolio; do
  echo "Building ${APP}..."
  docker buildx build \
    --platform linux/amd64 \
    --build-arg APP_NAME=${APP} \
    -f deploy/docker/Dockerfile.frontend \
    -t ${REGISTRY}/trading-wizard-${APP}:${COMMIT_HASH} \
    -t ${REGISTRY}/trading-wizard-${APP}:latest \
    --push \
    .
done

echo ""
echo "=== Build Complete ==="
echo "Images pushed:"
echo "  - ${REGISTRY}/trading-wizard-backend:${COMMIT_HASH}"
echo "  - ${REGISTRY}/trading-wizard-portal:${COMMIT_HASH}"
echo "  - ${REGISTRY}/trading-wizard-daily-focus:${COMMIT_HASH}"
echo "  - ${REGISTRY}/trading-wizard-my-portfolio:${COMMIT_HASH}"
echo ""
echo "To deploy:"
echo "  kubectl apply -k deploy/k8s/"
