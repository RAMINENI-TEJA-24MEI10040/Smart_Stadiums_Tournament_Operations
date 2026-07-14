# Smart Stadium Operations: Google Cloud Run Deployment Script
# This script compiles assets locally using direct Node paths and triggers Google Cloud Build to run on Cloud Run.

$ErrorActionPreference = "Stop"

Write-Host "🏟️  Smart Stadium Operations GCP Deployer" -ForegroundColor Cyan
Write-Host "----------------------------------------"

# 1. Verify Project ID parameter
$projectId = Read-Host -Prompt "Enter your Google Cloud Project ID (e.g., smart-stadiums-12345)"
if ([string]::IsNullOrWhiteSpace($projectId)) {
    Write-Error "Project ID cannot be empty."
    Exit 1
}

# 2. Compile assets locally to avoid npm cmd.exe lifecycle path ampersand splits
Write-Host "`n🛠️  Step 1: Compiling application workspaces..." -ForegroundColor Yellow

Write-Host "-> Installing workspace packages..."
npm run setup

Write-Host "-> Building backend API target..."
node .\node_modules\typescript\bin\tsc --project .\backend\tsconfig.json

Write-Host "-> Building frontend React panel..."
node .\node_modules\typescript\bin\tsc --project .\frontend\tsconfig.json
cd frontend
node ..\node_modules\vite\bin\vite.js build
cd ..

Write-Host "✓ Local compilation completed successfully!" -ForegroundColor Green

# 3. Configure Google Cloud CLI
Write-Host "`n☁️  Step 2: Checking Google Cloud CLI authentication..." -ForegroundColor Yellow
Write-Host "Connecting to project: $projectId..."
gcloud config set project $projectId

# 4. Trigger Cloud Build & Run Deploy
Write-Host "`n🚀 Step 3: Triggering Google Cloud Run deployment..." -ForegroundColor Yellow
Write-Host "This will build and deploy the container via Google Cloud Buildpacks."

gcloud run deploy smart-stadiums-ops `
    --source . `
    --region us-central1 `
    --allow-unauthenticated `
    --set-env-vars "NODE_ENV=production,DB_PROVIDER=sqlite"

Write-Host "`n🎉 Deployment complete!" -ForegroundColor Green
Write-Host "Deploy URL can be fetched by running: gcloud run services describe smart-stadiums-ops --region us-central1 --format='value(status.url)'" -ForegroundColor Cyan
