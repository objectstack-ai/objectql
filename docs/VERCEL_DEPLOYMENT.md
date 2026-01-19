# Deploying ObjectQL Documentation to Vercel

This guide explains how to deploy the ObjectQL documentation site (including the Progress Dashboard) to Vercel.

## Prerequisites

- A Vercel account (sign up at [vercel.com](https://vercel.com))
- Admin access to the `objectstack-ai/objectql` GitHub repository
- PNPM installed locally (for testing)

## Quick Start

### Option 1: Automated Deployment (Recommended)

1. **Connect to Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select "Import Git Repository"
   - Choose `objectstack-ai/objectql`

2. **Configure Project:**
   Vercel will auto-detect the VitePress configuration from `vercel.json`:
   
   ```json
   {
     "buildCommand": "pnpm run docs:build",
     "outputDirectory": "docs/.vitepress/dist",
     "installCommand": "pnpm install"
   }
   ```
   
   No manual configuration needed!

3. **Deploy:**
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - You'll receive a URL like `objectql.vercel.app`

4. **Set up Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `docs.objectql.org`)
   - Follow DNS configuration instructions

### Option 2: Vercel CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to project root
cd /path/to/objectql

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Project Configuration

### vercel.json

The configuration file at the project root:

```json
{
  "buildCommand": "pnpm run docs:build",
  "devCommand": "pnpm run docs:dev",
  "installCommand": "pnpm install",
  "framework": "vitepress",
  "outputDirectory": "docs/.vitepress/dist",
  "ignoreCommand": "git diff --quiet HEAD^ HEAD ./docs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/progress",
      "destination": "/dashboard",
      "permanent": false
    }
  ]
}
```

**Key Settings:**

- `ignoreCommand`: Prevents deployment if no docs changes detected
- `headers`: Security headers for all routes
- `redirects`: URL redirects (e.g., `/progress` → `/dashboard`)

### Build Settings

**Build Command:**
```bash
pnpm run docs:build
```

This runs VitePress build which:
1. Processes all `.md` files
2. Compiles Vue components
3. Generates static HTML/CSS/JS
4. Outputs to `docs/.vitepress/dist`

**Install Command:**
```bash
pnpm install
```

Installs all dependencies from `pnpm-lock.yaml`.

**Output Directory:**
```
docs/.vitepress/dist
```

Contains the built static site.

## Environment Variables

Currently, no environment variables are required. Future enhancements may add:

- `GITHUB_TOKEN` - For GitHub API integration
- `CODECOV_TOKEN` - For live coverage data
- `ANALYTICS_ID` - For usage analytics

To add environment variables:
1. Go to Project Settings → Environment Variables
2. Add key-value pairs
3. Redeploy

## Deployment Workflow

### Automatic Deployments

**Production (main branch):**
- Triggers: Push to `main` branch
- URL: Your production domain
- Condition: Only if `docs/` directory changes

**Preview (Pull Requests):**
- Triggers: Any PR
- URL: Unique preview URL per PR
- Visible as PR comment/check

**Branch Deployments:**
- Any branch push creates a preview
- URL: `branch-name.objectql.vercel.app`

### Manual Deployments

Using the Vercel Dashboard:
1. Go to Deployments tab
2. Click "Redeploy" on any deployment
3. Choose production or preview

Using CLI:
```bash
vercel --prod  # Deploy to production
vercel         # Deploy to preview
```

## Monitoring & Analytics

### Deployment Status

**Via Dashboard:**
- View all deployments
- Check build logs
- Monitor performance

**Via CLI:**
```bash
vercel ls                    # List deployments
vercel logs <deployment-url> # View logs
vercel inspect <url>         # Inspect deployment
```

### Build Logs

Access build logs to troubleshoot:
1. Go to Deployments
2. Click on a deployment
3. View "Building" logs
4. Check for errors

### Performance Monitoring

Vercel provides:
- **Core Web Vitals**: LCP, FID, CLS
- **Analytics**: Page views, visitors
- **Speed Insights**: Performance scores

Enable in: Project Settings → Analytics

## Troubleshooting

### Build Failures

**Issue: Build timeout**
```
Error: Build exceeded maximum duration
```

**Solution:**
- Optimize VitePress config
- Reduce image sizes
- Enable build caching

**Issue: Module not found**
```
Error: Cannot find module 'vitepress'
```

**Solution:**
- Ensure `pnpm-lock.yaml` is committed
- Verify `package.json` has correct dependencies
- Clear Vercel cache and redeploy

**Issue: Vue component errors**
```
Error: Failed to resolve component
```

**Solution:**
- Check component import paths
- Verify Vue syntax
- Test build locally first

### Preview Not Updating

**Solution:**
1. Clear Vercel cache
2. Force redeploy
3. Check `ignoreCommand` in `vercel.json`

### Custom Domain Issues

**Issue: DNS not propagating**
- Wait 24-48 hours for DNS propagation
- Verify DNS records in domain registrar
- Use `dig` or `nslookup` to test

**Issue: SSL certificate error**
- Vercel auto-provisions SSL
- May take a few minutes
- Contact Vercel support if persists

## Best Practices

### 1. Test Locally Before Deploying

```bash
# Install dependencies
pnpm install

# Run dev server
pnpm run docs:dev

# Build to test production
pnpm run docs:build

# Preview production build
pnpm run docs:preview
```

### 2. Use Preview Deployments

- Always create PR for changes
- Test on preview URL before merging
- Share preview with team for feedback

### 3. Monitor Build Times

- Keep builds under 5 minutes
- Optimize images and assets
- Use incremental builds when possible

### 4. Version Control

- Commit `vercel.json`
- Don't commit `.vercel` directory
- Add to `.gitignore`:
  ```
  .vercel
  ```

### 5. Security

- Enable HTTPS only
- Set security headers (already in `vercel.json`)
- Use environment variables for secrets

## Dashboard-Specific Considerations

### Static Data vs. Dynamic Data

**Current Implementation:**
- Dashboard uses static data in Vue components
- Data manually updated by editing component files

**Future Enhancement:**
- Fetch data from `docs/dashboard/data/metrics.json`
- Auto-update via GitHub Actions
- Real-time from GitHub API

### Updating Dashboard on Vercel

**Manual Update:**
1. Edit Vue components locally
2. Commit changes
3. Push to `main`
4. Vercel auto-deploys

**Automated Update:**
1. GitHub Action runs daily
2. Collects metrics
3. Updates `metrics.json`
4. Commits and pushes
5. Triggers Vercel deployment

### Cache Considerations

Vercel caches static assets aggressively. To ensure fresh data:

```json
{
  "headers": [
    {
      "source": "/dashboard/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        }
      ]
    }
  ]
}
```

## Cost Considerations

### Free Tier (Hobby)

Perfect for most projects:
- 100 GB bandwidth/month
- Unlimited deployments
- Auto SSL
- Preview deployments

### Pro Tier ($20/month)

For high-traffic projects:
- 1 TB bandwidth/month
- Advanced analytics
- Team collaboration
- Priority support

### Enterprise

Contact Vercel for:
- Custom bandwidth
- SLA guarantees
- Dedicated support

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [VitePress Deployment Guide](https://vitepress.dev/guide/deploy)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Vercel GitHub Integration](https://vercel.com/docs/git)

## Support

**Issues with Deployment:**
1. Check [Vercel Status](https://www.vercel-status.com/)
2. Review [Vercel Community](https://github.com/vercel/vercel/discussions)
3. Contact Vercel Support (Pro/Enterprise)

**Issues with Dashboard:**
1. Check build logs in Vercel
2. Test locally with `pnpm run docs:dev`
3. Review Vue component errors
4. Open issue on GitHub

---

**Last Updated:** January 19, 2026  
**Maintained by:** ObjectQL Core Team
