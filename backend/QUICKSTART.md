# 🚀 Quick Start - Backend Deployment

## Prerequisites Check

```bash
# Check if tools are installed
gcloud --version
docker --version
```

If not installed:
- gcloud: https://cloud.google.com/sdk/docs/install
- Docker: https://www.docker.com/products/docker-desktop

## 1-Minute Deploy

```bash
cd backend
./deploy.sh
```

That's it! The script handles everything.

## First-Time Setup

### 1. Initialize gcloud

```bash
gcloud init
gcloud auth login
gcloud config set project shelfmates-de7ef
```

### 2. Enable APIs

```bash
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

### 3. Configure Docker for GCR

```bash
gcloud auth configure-docker
```

### 4. Deploy

```bash
./deploy.sh
```

## After Deployment

⚠️ **IMPORTANT**: Your backend URL is **STABLE** and won't change between deploys!

1. **Get your backend URL**:
   ```bash
   ./get-backend-url.sh
   ```

2. **Add to Vercel** environment variables (ONLY FIRST TIME):
   ```
   VITE_API_URL=https://your-backend-url.run.app
   ```

3. **Update CORS** in Cloud Run:
   - Go to Cloud Console → Cloud Run → shelfmates-backend
   - Edit & Deploy New Revision → Variables & Secrets
   - Update `ALLOWED_ORIGINS` with your Vercel URL

4. **Test it**:
   ```bash
   curl https://your-backend-url.run.app/health
   ```

### Optional: Custom Domain

Want to use `api.shelfmates.com` instead of the Cloud Run URL?

```bash
./setup-custom-domain.sh
```

## Common Commands

```bash
# View logs
gcloud run services logs read shelfmates-backend --region=us-central1 --follow

# Get service URL
gcloud run services describe shelfmates-backend --region=us-central1 --format='value(status.url)'

# Update environment variable
gcloud run services update shelfmates-backend \
  --region=us-central1 \
  --set-env-vars="ALLOWED_ORIGINS=[\"https://your-app.vercel.app\"]"

# Redeploy
./deploy.sh
```

## Troubleshooting

**"Permission denied" error**
```bash
chmod +x deploy.sh
```

**"gcloud: command not found"**
```bash
# Install gcloud SDK first
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**CORS errors from frontend**
Update `ALLOWED_ORIGINS` in Cloud Run to include your Vercel domain

**Docker build fails**
```bash
# Test locally first
docker build -t test-build .
```

## Next Steps

- Read full deployment guide: `../DEPLOYMENT.md`
- Set up CI/CD with GitHub Actions
- Configure monitoring and alerts
