#!/usr/bin/env bash
set -euo pipefail

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI is required. Install it from https://aka.ms/azure-cli"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop or Docker Engine."
  exit 1
fi

: "${AZURE_RESOURCE_GROUP:?AZURE_RESOURCE_GROUP is required}"
: "${AZURE_LOCATION:?AZURE_LOCATION is required}"
: "${AZURE_ACR_NAME:?AZURE_ACR_NAME is required}"
: "${AZURE_APP_SERVICE_PLAN:?AZURE_APP_SERVICE_PLAN is required}"
: "${AZURE_WEBAPP_BACKEND:?AZURE_WEBAPP_BACKEND is required}"
: "${AZURE_WEBAPP_FRONTEND:?AZURE_WEBAPP_FRONTEND is required}"

ACR_LOGIN_SERVER="${AZURE_ACR_NAME}.azurecr.io"
BACKEND_IMAGE="${ACR_LOGIN_SERVER}/shiftsync-backend:latest"
FRONTEND_IMAGE="${ACR_LOGIN_SERVER}/shiftsync-frontend:latest"

echo "==> Creating Azure resource group: ${AZURE_RESOURCE_GROUP}"
az group create --name "$AZURE_RESOURCE_GROUP" --location "$AZURE_LOCATION"

echo "==> Ensuring Azure Container Registry: ${AZURE_ACR_NAME}"
az acr create --resource-group "$AZURE_RESOURCE_GROUP" --name "$AZURE_ACR_NAME" --sku Basic --admin-enabled true --location "$AZURE_LOCATION" || true

echo "==> Logging in to ACR"
az acr login --name "$AZURE_ACR_NAME"

echo "==> Creating App Service plan: ${AZURE_APP_SERVICE_PLAN}"
az appservice plan create --name "$AZURE_APP_SERVICE_PLAN" --resource-group "$AZURE_RESOURCE_GROUP" --is-linux --sku B1 || true

echo "==> Building backend Docker image"
docker build -t "$BACKEND_IMAGE" ./backend

echo "==> Building frontend Docker image"
docker build -t "$FRONTEND_IMAGE" ./frontend

echo "==> Pushing backend image to ACR"
docker push "$BACKEND_IMAGE"

echo "==> Pushing frontend image to ACR"
docker push "$FRONTEND_IMAGE"

echo "==> Creating or updating backend Web App: ${AZURE_WEBAPP_BACKEND}"
az webapp create --resource-group "$AZURE_RESOURCE_GROUP" --plan "$AZURE_APP_SERVICE_PLAN" --name "$AZURE_WEBAPP_BACKEND" --deployment-container-image-name "$BACKEND_IMAGE" || true

echo "==> Creating or updating frontend Web App: ${AZURE_WEBAPP_FRONTEND}"
az webapp create --resource-group "$AZURE_RESOURCE_GROUP" --plan "$AZURE_APP_SERVICE_PLAN" --name "$AZURE_WEBAPP_FRONTEND" --deployment-container-image-name "$FRONTEND_IMAGE" || true

ACR_USERNAME=$(az acr credential show --name "$AZURE_ACR_NAME" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$AZURE_ACR_NAME" --query "passwords[0].value" -o tsv)

if [[ -z "$ACR_USERNAME" || -z "$ACR_PASSWORD" ]]; then
  echo "Failed to resolve ACR credentials. Ensure the ACR exists and the signed-in Azure identity has access."
  exit 1
fi

echo "==> Configuring backend Web App with ACR credentials"
az webapp config container set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_WEBAPP_BACKEND" \
  --docker-custom-image-name "$BACKEND_IMAGE" \
  --docker-registry-server-url "https://$ACR_LOGIN_SERVER" \
  --docker-registry-server-user "$ACR_USERNAME" \
  --docker-registry-server-password "$ACR_PASSWORD"

echo "==> Configuring frontend Web App with ACR credentials"
az webapp config container set \
  --resource-group "$AZURE_RESOURCE_GROUP" \
  --name "$AZURE_WEBAPP_FRONTEND" \
  --docker-custom-image-name "$FRONTEND_IMAGE" \
  --docker-registry-server-url "https://$ACR_LOGIN_SERVER" \
  --docker-registry-server-user "$ACR_USERNAME" \
  --docker-registry-server-password "$ACR_PASSWORD"

echo "==> Deployment complete"
echo "Backend URL: https://${AZURE_WEBAPP_BACKEND}.azurewebsites.net"
echo "Frontend URL: https://${AZURE_WEBAPP_FRONTEND}.azurewebsites.net"
