# Deployment Guide

This guide explains how to take MortMortgage from a demo/development setup to a production-ready deployment.

---

## Current Setup (Development)

The demo uses simplified infrastructure that's easy to run locally:

| Component | Demo Setup | Why It Works for Demo |
|-----------|------------|----------------------|
| Database | SQLite (file-based) | Zero configuration, runs anywhere |
| Secrets | `.env` file | Simple, no external services |
| Hosting | `npm run dev` | Hot reload for development |
| Integrations | Mock mode | No API keys required |

---

## Production Checklist

Before deploying to production, address these areas:

### 1. Database: SQLite → PostgreSQL

**Why change?** SQLite is a single file — it can't handle multiple servers or heavy traffic.

**How to switch:**

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // Change from "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env` with PostgreSQL connection string:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/mortmortgage"
   ```

3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

**PostgreSQL providers:**
- [Neon](https://neon.tech) — Free tier, serverless
- [Supabase](https://supabase.com) — Free tier, includes auth
- [Railway](https://railway.app) — Simple deployment
- AWS RDS, Google Cloud SQL, Azure Database — Enterprise options

---

### 2. Environment Variables

**Never commit secrets to git.** Use environment variables in production.

| Variable | Development | Production |
|----------|-------------|------------|
| `DATABASE_URL` | `file:./dev.db` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Demo value | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` | Your production URL |
| `MOCK_MODE` | `true` | `false` (use real integrations) |
| `NODE_ENV` | `development` | `production` |

**Generate a secure secret:**
```bash
openssl rand -base64 32
```

#### Third-Party Integrations

**Plaid (Bank Account Linking & Income Verification)**

| Variable | Development | Production |
|----------|-------------|------------|
| `PLAID_CLIENT_ID` | Your sandbox client ID | Your production client ID |
| `PLAID_SECRET` | Your sandbox secret | Your production secret |
| `PLAID_ENV` | `sandbox` | `production` |

- **Sandbox**: Uses test credentials (`user_good` / `pass_good`), no real bank data
- **Production**: Requires Plaid account approval and real credentials
- Get keys at: [dashboard.plaid.com](https://dashboard.plaid.com)

**Google Places (Address Autocomplete)**

| Variable | Development | Production |
|----------|-------------|------------|
| `GOOGLE_PLACES_API_KEY` | Your API key | Your API key (restrict by domain) |

- **Development**: Unrestricted key is fine for localhost
- **Production**: Restrict the key to your domain in Google Cloud Console
- Get keys at: [console.cloud.google.com](https://console.cloud.google.com)
- Enable the "Places API" and "Maps JavaScript API"

**Note:** Both integrations have graceful fallbacks — the app works without them (Plaid shows demo mode, addresses use manual entry).

---

### 3. Docker Production Build

The included `Dockerfile` works for basic deployment. For production:

**Build the image:**
```bash
docker build -t mortmortgage:latest .
```

**Run with environment variables:**
```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="your-secret" \
  -e NODE_ENV="production" \
  mortmortgage:latest
```

**Improvements for production:**
- Add a `.dockerignore` file to reduce image size
- Use multi-stage builds to separate build and runtime
- Add health checks for container orchestration

---

### 4. Cloud Deployment Options

#### Option A: Vercel (Easiest)

Best for: Quick deployment, automatic scaling, zero configuration

```bash
npm install -g vercel
vercel
```

Vercel handles:
- Automatic HTTPS
- Global CDN
- Serverless functions for API routes
- Preview deployments for PRs

**Database:** Use Vercel Postgres or connect to external PostgreSQL.

#### Option B: Railway

Best for: Full-stack apps with database included

1. Connect your GitHub repo
2. Railway auto-detects Next.js
3. Add PostgreSQL plugin
4. Set environment variables

#### Option C: AWS / GCP / Azure

Best for: Enterprise requirements, existing cloud infrastructure

**AWS options:**
- AWS Amplify — Similar to Vercel
- ECS/Fargate — Container-based
- EC2 — Traditional VM

**GCP options:**
- Cloud Run — Serverless containers
- App Engine — Managed platform
- GKE — Kubernetes

**Azure options:**
- Azure App Service — Managed platform
- Azure Container Apps — Serverless containers
- AKS — Kubernetes

---

### 5. Kubernetes (For Scale)

**What is Kubernetes?** A system for running and managing containers across multiple servers. Use it when you need:
- High availability (app stays up if a server fails)
- Auto-scaling (add capacity during traffic spikes)
- Multiple environments (dev, staging, production)

**When you DON'T need Kubernetes:**
- Single application with moderate traffic
- Small team without DevOps expertise
- Budget constraints (K8s adds complexity)

**Managed Kubernetes options:**
- AWS EKS
- Google GKE
- Azure AKS
- DigitalOcean Kubernetes

**Basic deployment pattern:**
```yaml
# Example Kubernetes deployment (k8s/deployment.yaml)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mortmortgage
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mortmortgage
  template:
    metadata:
      labels:
        app: mortmortgage
    spec:
      containers:
        - name: app
          image: mortmortgage:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: database-url
```

---

### 6. Monitoring & Logging

**Why monitoring matters:** In production, you can't see console logs. You need tools to:
- Track errors
- Monitor performance
- Alert on issues

**Recommended tools:**

| Tool | Purpose | Pricing |
|------|---------|---------|
| [Sentry](https://sentry.io) | Error tracking | Free tier |
| [LogRocket](https://logrocket.com) | Session replay | Free tier |
| [Vercel Analytics](https://vercel.com/analytics) | Performance | Free with Vercel |
| [Datadog](https://datadoghq.com) | Full observability | Enterprise |

**Basic setup (Sentry):**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

### 7. Security Checklist

Before going live:

- [ ] **Secrets**: All sensitive values in environment variables (not `.env` file)
- [ ] **HTTPS**: Enabled (automatic on Vercel/Railway)
- [ ] **CORS**: Configured for your domain only
- [ ] **Rate limiting**: Protect API endpoints from abuse
- [ ] **Input validation**: Already implemented ✅
- [ ] **Authentication**: NextAuth configured ✅
- [ ] **Dependencies**: Run `npm audit` and fix vulnerabilities

---

## Summary: Recommended Path

| Stage | Recommendation |
|-------|----------------|
| **Demo/Development** | Current setup (SQLite, `.env`, `npm run dev`) |
| **MVP Launch** | Vercel + Vercel Postgres (or Neon) |
| **Growth** | Railway or AWS Amplify with managed PostgreSQL |
| **Enterprise** | Kubernetes on AWS/GCP/Azure with full monitoring |

Start simple. Scale when needed.

---

## Quick Reference

**Local development:**
```bash
npm install
npx prisma db push
npm run dev
```

**Run tests:**
```bash
npm test
```

**Build for production:**
```bash
npm run build
npm start
```

**Docker:**
```bash
docker build -t mortmortgage .
docker run -p 3000:3000 mortmortgage
```
