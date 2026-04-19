---
name: vercel-deployment
description: >
  Help users deploy Next.js applications to Vercel with best practices.
  Trigger: When user asks about deploying to Vercel, vercel CLI commands,
  Vercel configuration, Vercel project setup, vercel.json, or .vercelignore.
license: Apache-2.0
metadata:
  author: smart-docs-ai
  version: "1.0.0"
---

## When to Use

- User asks about deploying a Next.js app to Vercel
- User needs help with `vercel.json` configuration
- User is setting up Vercel CLI or project linking
- User encounters build or deployment errors on Vercel
- User wants to configure environment variables, domains, or preview deployments
- User asks about Vercel-specific features (Edge Functions, ISR, revalidation)

## Critical Patterns

### Framework Detection

Vercel auto-detects Next.js. **Do NOT** add a custom build command unless explicitly needed:

| Setting | Value | When to Override |
|---------|-------|------------------|
| Framework Preset | Next.js (auto) | Monorepo with custom structure |
| Build Command | `next build` (auto) | Turborepo or custom build scripts |
| Output Directory | `.next` (auto) | Standalone output mode |
| Install Command | `npm ci` / `pnpm install` (auto) | Custom dependency management |

### Next.js 15 Specifics

Next.js 15 uses React 19 and Turbopack by default in dev. For Vercel deployments:

- **Turbopack**: Not used in production builds — Vercel uses SWC. No action needed.
- **React 19**: Fully supported on Vercel. No special config required.
- **Server Actions**: Work out of the box on Vercel serverless functions.
- **Partial Prerendering (PPR)**: Enable with `experimental.ppr` in `next.config.ts`.

### Output Modes

| Mode | Config | Use When |
|------|--------|----------|
| Default | (none) | Standard Vercel deployment |
| Standalone | `output: 'standalone'` | Docker / self-hosted (NOT Vercel) |
| Export | `output: 'export'` | Static sites only (no API routes) |

**Rule**: Do NOT set `output: 'standalone'` for Vercel deployments — it conflicts with Vercel's build system.

## Code Examples

### next.config.ts (Minimal for Vercel)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
```

### Environment Variables via CLI

```bash
vercel env add NEXT_PUBLIC_API_URL production
vercel env add DATABASE_URL production
vercel env ls
```

### Deploy to Preview

```bash
vercel --yes
```

### Deploy to Production

```bash
vercel --prod --yes
```

### Link Existing Project

```bash
vercel link
```

## Commands

| Command | Purpose |
|---------|---------|
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel --yes` | Skip confirmation prompts |
| `vercel link` | Link to existing Vercel project |
| `vercel env add <KEY>` | Add environment variable |
| `vercel env ls` | List environment variables |
| `vercel env pull .env.local` | Pull env vars to local file |
| `vercel domains add <domain>` | Add custom domain |
| `vercel logs` | View deployment logs |
| `vercel inspect` | Inspect deployment details |
| `vercel builds ls` | List recent builds |
| `vercel rollback` | Rollback to previous deployment |
| `vercel remove` | Remove project from Vercel |
| `vercel project ls` | List all projects |

## Environment Management

### Environments on Vercel

| Environment | Trigger | Use For |
|-------------|---------|---------|
| Development | `vercel dev` | Local development |
| Preview | Branch push (non-production) | PR reviews, staging |
| Production | `main`/`master` push or `vercel --prod` | Live users |

### Setting Environment Variables

```bash
# Interactive prompt (selects environment)
vercel env add NEXT_PUBLIC_API_URL

# Add to specific environment
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_API_URL preview
vercel env add NEXT_PUBLIC_API_URL development
```

### Next.js Public Env Vars

Variables prefixed with `NEXT_PUBLIC_` are inlined at build time. Non-prefixed variables are only available server-side.

## Monorepo Deployment

### Root Directory Configuration

If the Next.js app lives inside a subdirectory (e.g., `frontend/`):

1. Set **Root Directory** to `frontend` in Vercel dashboard project settings
2. OR use `vercel.json` at repo root:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next"
}
```

3. OR use Turborepo with `turbo.json` — Vercel auto-detects Turborepo

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Build exceeded maximum duration` | Large dependencies or slow build | Use `next.config.ts` `experimental.optimizePackageImports` |
| `Module not found` | Missing dependency | Ensure it's in `dependencies`, not `devDependencies` |
| `Page not found on refresh` | Missing catch-all routes | Add `[...slug]` or `[[...slug]]` page |
| `CORS errors` | API calls to different origin | Use `NEXT_PUBLIC_API_URL` env var for API base URL |
| `Image optimization failed` | Unconfigured remote domains | Add `remotePatterns` in `next.config.ts` images config |
| `Static page generation failed` | Dynamic data without `generateStaticParams` | Use `export const dynamic = 'force-dynamic'` or add `generateStaticParams` |
| `Bundle size too large` | Large client bundles | Use `@next/bundle-analyzer`, dynamic imports, tree-shaking |
| `Middleware timeout` | Heavy middleware logic | Move logic to API routes, keep middleware lightweight |

## Best Practices

1. **Never commit `.env.local`** — use `vercel env add` for secrets
2. **Use `vercel.json` sparingly** — Vercel auto-configures most Next.js settings
3. **Leverage Preview Deployments** — every push to a non-production branch gets a unique URL
4. **Set up branch protection** — only allow production deploys from `main`
5. **Use `vercel env pull .env.local`** to sync local development with Vercel env vars
6. **Monitor bundle size** — Vercel shows bundle analysis in deployment logs
7. **Use Edge Runtime sparingly** — only for middleware or specific API routes that benefit from it
8. **Pin Node.js version** — add `"engines": { "node": ">=20.x" }` to `package.json`

## Resources

- **Templates**: See [assets/templates/](assets/templates/) for `vercel.json` and `.vercelignore` templates
- **Examples**: See [assets/examples/](assets/examples/) for a complete deployment walkthrough
- **References**: See [references/](references/) for Vercel documentation links
