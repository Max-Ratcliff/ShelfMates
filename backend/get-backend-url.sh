#!/bin/bash

# Get the current backend URL
set -e

PROJECT_ID="shelfmates-de7ef"
SERVICE_NAME="shelfmates-backend"
REGION="us-central1"

echo "🔍 Fetching backend service URL..."

# Check if service exists
if ! gcloud run services describe ${SERVICE_NAME} --region ${REGION} &> /dev/null; then
  echo "❌ Service '${SERVICE_NAME}' not found in region '${REGION}'"
  echo "   Run './deploy.sh' to deploy the backend first"
  exit 1
fi

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo "✅ Backend URL: ${SERVICE_URL}"
echo ""
echo "📋 This URL should be set in Vercel as:"
echo "   VITE_API_URL=${SERVICE_URL}"
echo ""
echo "💡 This URL is stable and won't change unless you delete the service"
