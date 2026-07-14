# Production Deployment Manual

This document details the configuration variables, local execution, build targets, and cloud hosting guidelines for the Smart Stadiums platform.

---

## 1. Deployment Environments

### 1.1 Development Environment
- **Node.js**: `v20.x` or later.
- **Local DB**: SQLite WebAssembly (`sql.js`) client storing a dynamic memory dump to `stadium_dev.db`.
- **API URL**: `http://localhost:5000`
- **Client UI URL**: `http://localhost:5173`
- **Features Active**: Stack trace outputs on error endpoints, in-memory semantic response caching, and mock LLM providers (if no Gemini API key is configured).

### 1.2 Production Environment
- **Node.js**: `v20.x` or later.
- **Production DB**: PostgreSQL server connection pools.
- **Static Assets Hosting**: Serves compiled React assets inside the Express server via `express.static`, or hosts them directly on a CDN (e.g. Google Cloud Storage or Cloudflare Pages).
- **Features Active**: Stack trace stripping, secure cookies (CSRF & JWT flags), active telemetry logs, and strict Gemini integration checking.

---

## 2. Environment Configuration variables

Create a `.env` file at the root of the workspace using these settings:

| Variable Name | Required | Recommended Production Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Yes | `5000` | Port for the Express backend. |
| `NODE_ENV` | Yes | `production` | Set to `production` to secure cookies and strip stack traces. |
| `JWT_SECRET` | Yes | *Generate high-entropy hex string* | Secret key used to sign authorization tokens. |
| `DB_PROVIDER` | Yes | `postgres` | Switcher flag (`postgres` \| `sqlite` \| `json`). |
| `DATABASE_URL` | No | `postgresql://user:pass@host:5432/dbname` | PostgreSQL connection string. |
| `GEMINI_API_KEY` | Yes | *Your Google MakerSuite Key* | Key for specialized agents LLM generations. |
| `GEMINI_MODEL` | Yes | `gemini-1.5-flash` | Selected Google GenAI model. |
| `ALLOWED_ORIGINS` | Yes | `https://stadium.org` | Whitelisted client origins for CORS control. |

---

## 3. Build & Deployment Commands

### 3.1 Build Phase
Compile all assets locally from the workspace root:
```bash
# 1. Install dependencies
npm run setup

# 2. Build backend and frontend static assets
npm run build
```
- Backend compilation outputs type-safe Javascript files to `backend/dist/`.
- Frontend bundling outputs static index files to `frontend/dist/`.

### 3.2 Cloud Run Deployment (Google Cloud)
To deploy the entire monorepo as a single containerized service on Cloud Run:
```powershell
# Run the PowerShell deploy script (on a terminal with gcloud authenticated)
.\gcloud-deploy.ps1
```
This builds the container image using **Google Cloud Buildpacks** and starts a Cloud Run service mapping the target `NODE_ENV=production` environment variables.

### 3.3 Virtual Machine Deployments (PM2 & Node)
To host the app on a Linux VM (e.g., AWS EC2, GCP Compute Engine):
1. Compile build targets using `npm run build`.
2. Launch the backend server under PM2 to ensure automatically restarted runs on server crashes:
   ```bash
   npm install -g pm2
   pm2 start backend/dist/server.js --name "stadium-ops"
   ```

---

## 4. Reverse Proxy Configurations (Nginx)

Nginx is recommended to handle SSL termination and route requests to the backend server:

```nginx
server {
    listen 80;
    server_name stadium.operations.org;

    # Serve compiled static client files directly
    root /var/www/html/smart-stadiums/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API calls to the Express backend running on Port 5000
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Health Checks & Monitoring

### 5.1 Health Check Endpoint
- **Endpoint**: `GET /api/stadium/health`
- **Payload Return**: Returns CPU load, memory utilization, connection pool counts, active uptime, and AI query latency logs.
- **Status Codes**: 
  - `HTTP 200 OK` if database and processes are healthy.
  - `HTTP 500 Internal Server Error` if database or telemetry modules crash.

### 5.2 Structured Auditing Logs
- All mutative database modifications (POST, PATCH, DELETE) are logged via a custom auditing middleware.
- In production, console logs output structured JSON events for compatibility with cloud log parsers (e.g., Google Cloud Logging or AWS CloudWatch).
- Confidentially protected: No passwords, credit cards, or authorization headers are logged.
