#!/bin/bash

# ShelfMates Backend Deployment to Google Cloud Run
set -e

# Configuration
PROJECT_ID="shelfmates-de7ef"
SERVICE_NAME="shelfmates-backend"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🚀 Starting backend deployment to Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set the project
echo "📋 Setting GCP project to ${PROJECT_ID}..."
gcloud config set project ${PROJECT_ID}

# Build the Docker image for AMD64 (Cloud Run requirement)
echo "🔨 Building Docker image for linux/amd64..."
docker build --platform linux/amd64 -t ${IMAGE_NAME}:latest .

# Push to Google Container Registry
echo "📤 Pushing image to GCR..."
docker push ${IMAGE_NAME}:latest

# Generate a secure secret key if not already set
SECRET_KEY="${SECRET_KEY:-$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")}"

# Create temporary env vars file for deployment (YAML format)
ENV_FILE=$(mktemp).yaml
cat > ${ENV_FILE} << EOF
ENVIRONMENT: production
FIREBASE_PROJECT_ID: ${PROJECT_ID}
SECRET_KEY: ${SECRET_KEY}
ALLOWED_ORIGINS: https://shelf-mates.vercel.app,http://localhost:8080,http://localhost:5173
EOF

# Check if service exists
echo "🔍 Checking if service exists..."
if gcloud run services describe ${SERVICE_NAME} --region ${REGION} &> /dev/null; then
  echo "📦 Service exists, updating..."
  EXISTING_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
  echo "   Current URL: ${EXISTING_URL}"
else
  echo "🆕 Service doesn't exist, creating..."
fi

# Deploy to Cloud Run
echo "🌐 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --env-vars-file ${ENV_FILE}

# Clean up temp file
rm -f ${ENV_FILE}

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')

echo "✅ Deployment successful!"
echo "🎉 Backend is live at: ${SERVICE_URL}"
echo ""
echo "⚠️  IMPORTANT: This URL is STABLE and should NOT change between deploys!"
echo "   Only update Vercel if this is your first deployment or if you deleted the service."
echo ""
echo "📝 Next steps (ONLY IF FIRST DEPLOYMENT):"
echo "1. Add this to Vercel environment variables:"
echo "   VITE_API_URL=${SERVICE_URL}"
echo ""
echo "2. Go to: https://vercel.com/dashboard"
echo "   → shelf-mates project → Settings → Environment Variables"
echo ""
echo "3. Redeploy your Vercel app to apply the changes"
echo ""
echo "🌐 Your app: https://shelf-mates.vercel.app"
echo "📚 API docs: ${SERVICE_URL}/api/docs"
echo ""
echo "💡 Pro tip: To use a custom domain (e.g., api.shelfmates.com), run:"
echo "   ./setup-custom-domain.sh"
