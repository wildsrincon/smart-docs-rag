# Complete Vercel Deployment Guide

## Prerequisites

- Node.js 20+
- A Vercel account (free tier works)
- Vercel CLI installed: `npm i -g vercel`

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

## Step 2: Login to Vercel

```bash
vercel login
```

This opens a browser window for authentication.

## Step 3: Initialize Project

From your Next.js project root:

```bash
vercel
```

Answer the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your account/team
- **Link to existing project?** No
- **Project name?** your-project-name
- **Which directory is your code in?** `./` (or `frontend/` for monorepos)
- **Want to modify settings?** No (accept defaults for Next.js)

This creates a `.vercel/` directory with project metadata. **Add `.vercel/` to `.gitignore`**.

## Step 4: Configure Environment Variables

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Paste your production API URL when prompted

vercel env add NEXT_PUBLIC_API_URL preview
# Paste your preview/staging API URL

vercel env add DATABASE_URL production
# Paste your production database URL
```

Verify:
```bash
vercel env ls
```

## Step 5: Deploy to Production

```bash
vercel --prod --yes
```

The `--yes` flag skips the confirmation prompt (useful for CI/CD).

Output will show:
```
> Production: https://your-project.vercel.app [2s]
```

## Step 6: Set Up Custom Domain (Optional)

```bash
vercel domains add yourdomain.com
```

Follow the DNS instructions Vercel provides. Then:

```bash
vercel domains inspect yourdomain.com
```

## Step 7: Pull Env Vars for Local Development

```bash
vercel env pull .env.local
```

This syncs your Vercel environment variables to a local `.env.local` file.

## CI/CD with GitHub

If you connected your GitHub repo to Vercel via the dashboard:

1. Every push to `main` → automatic production deployment
2. Every PR → automatic preview deployment with a unique URL
3. No additional configuration needed

## Monorepo Setup

If your Next.js app is in a subdirectory (e.g., `frontend/`):

### Option A: Vercel Dashboard

1. Go to Project Settings > General
2. Set **Root Directory** to `frontend`
3. Set **Framework Preset** to Next.js

### Option B: vercel.json at Repo Root

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm ci"
}
```

### Option C: Turborepo (Recommended for Monorepos)

Vercel auto-detects Turborepo. No extra config needed if you have a valid `turbo.json`.

## Rollback

If something goes wrong:

```bash
vercel rollback
```

Or use the Vercel dashboard: Deployments > hover over previous deploy > "Promote to Production".

## Monitoring

- **Deployment logs**: `vercel logs <deployment-url>`
- **Real-time logs**: Vercel Dashboard > Logs
- **Analytics**: Vercel Dashboard > Analytics (enable Speed Insights and Web Vitals)
