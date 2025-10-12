#!/bin/bash

# Setup custom domain for Cloud Run service
set -e

PROJECT_ID="shelfmates-de7ef"
SERVICE_NAME="shelfmates-backend"
REGION="us-central1"

echo "🌐 Custom Domain Setup for ShelfMates Backend"
echo "=============================================="
echo ""

# Check if service exists
if ! gcloud run services describe ${SERVICE_NAME} --region ${REGION} &> /dev/null; then
  echo "❌ Service '${SERVICE_NAME}' not found. Deploy it first:"
  echo "   ./deploy.sh"
  exit 1
fi

SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format 'value(status.url)')
echo "📍 Current service URL: ${SERVICE_URL}"
echo ""

echo "To set up a custom domain (e.g., api.shelfmates.com):"
echo ""
echo "1️⃣  Verify domain ownership with Google:"
echo "   gcloud domains verify shelfmates.com"
echo ""
echo "2️⃣  Add domain mapping:"
echo "   gcloud run domain-mappings create \\"
echo "     --service ${SERVICE_NAME} \\"
echo "     --domain api.shelfmates.com \\"
echo "     --region ${REGION}"
echo ""
echo "3️⃣  Get the DNS records:"
echo "   gcloud run domain-mappings describe \\"
echo "     --domain api.shelfmates.com \\"
echo "     --region ${REGION}"
echo ""
echo "4️⃣  Add the DNS records to your domain provider:"
echo "   - Add the CNAME or A records shown in step 3"
echo "   - Wait for DNS propagation (up to 48 hours)"
echo ""
echo "5️⃣  Update Vercel environment variable:"
echo "   VITE_API_URL=https://api.shelfmates.com"
echo ""
echo "6️⃣  Update ALLOWED_ORIGINS in Cloud Run:"
echo "   gcloud run services update ${SERVICE_NAME} \\"
echo "     --region ${REGION} \\"
echo "     --update-env-vars ALLOWED_ORIGINS=https://shelf-mates.vercel.app,https://api.shelfmates.com"
echo ""
echo "📚 More info: https://cloud.google.com/run/docs/mapping-custom-domains"
echo ""
echo "💡 Pro tip: Use a subdomain like 'api.' to keep your main domain separate"
