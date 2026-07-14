# Production Deployment Manual: Local & Cloud Hosting

This document details the configuration variables, local execution, and production hosting guidelines for the Smart Stadiums platform.

---

## 1. Environment Configuration Checklist

Create a `.env` file at the root of the workspace using these settings:

| Variable Name | Description | Recommended Production Value |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment | `production` |
| `JWT_SECRET` | Secret key for JWT signing | Strong random string (e.g., 64-char hex) |
| `DB_PROVIDER` | Selected database adapter | `postgres` |
| `DATABASE_URL` | Postgres connection string | `postgresql://user:pass@host:5432/dbname` |
| `GEMINI_API_KEY` | Google AI Studio Key | Obtained from Google MakerSuite |
| `GEMINI_MODEL` | AI Model name | `gemini-1.5-flash` |
| `ALLOWED_ORIGINS` | CORS client whitelists | Whitelisted domain (comma-separated) |

---

## 2. Local Startup Guide

Run these commands from the root directory:

### 2.1 Workspace Setup
```bash
npm run setup
```

### 2.2 Development Execution
Spins up both the Express API and the Vite React server simultaneously:
```bash
npm run dev
```
- Frontend client runs on: `http://localhost:5173`
- Backend API server runs on: `http://localhost:5000`

### 2.3 Production Build Compile
```bash
npm run build
```

---

## 3. Production Recommendations (PM2 & Nginx)

For standard VM deployments (e.g., AWS EC2, GCP Compute Engine):

### 3.1 PM2 Process Manager
Run the backend build under PM2 to ensure automatic restarts on crashes:
```bash
npm install -g pm2
pm2 start dist/server.js --name "stadium-api"
```

### 3.2 Nginx Reverse Proxy Config
Nginx is recommended to serve Vite static build files directly, proxying `/api` socket connections to Express:

```nginx
server {
    listen 80;
    server_name stadium.operations.org;

    root /var/www/html/stadium-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Ensure SSL certificates are attached using Let's Encrypt Certbot.
