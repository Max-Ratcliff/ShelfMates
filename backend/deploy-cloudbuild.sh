#!/bin/bash

# Deploy using Cloud Build (no local Docker needed)
set -e

PROJECT_ID="shelfmates-de7ef"
SERVICE_NAME="shelfmates-backend"
REGION="us-central1"

echo "🚀 Deploying backend using Cloud Build (no local Docker needed)..."

# Set project
gcloud config set project ${PROJECT_ID}

# Deploy directly from source
gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars "ENVIRONMENT=production,PORT=8000"

# Get service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo "✅ Deployment successful!"
echo "🎉 Backend is live at: ${SERVICE_URL}"
echo ""
echo "📝 Next: Update VITE_API_URL=${SERVICE_URL} in Vercel"
