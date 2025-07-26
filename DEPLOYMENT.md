# Cloudflare Pages Deployment Guide

This guide covers deploying the jsonderulo Pipeline UI to Cloudflare Pages.

## Prerequisites

- Node.js 18+ and npm
- Git repository (GitHub, GitLab, or Bitbucket)
- Cloudflare account

## Quick Deploy

### Option 1: Automated Script

```bash
./deploy.sh
```

This script will:
- Install dependencies
- Run type checking
- Build the production bundle
- Provide deployment instructions

### Option 2: Manual Build

```bash
# Install dependencies
npm install

# Build UI for production
npm run build:ui

# The built files will be in dist-ui/
```

## Cloudflare Pages Setup

### Method 1: Git Integration (Recommended)

1. **Push to Git Repository**
   ```bash
   git add .
   git commit -m "Add Pipeline UI"
   git push origin feature/pipeline-ui-components
   ```

2. **Create Cloudflare Pages Project**
   - Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
   - Click "Create a project"
   - Connect your Git provider (GitHub/GitLab/Bitbucket)
   - Select your repository

3. **Configure Build Settings**
   ```
   Framework preset: None
   Build command: npm run build:ui
   Build output directory: dist-ui
   Root directory: /
   Environment variables: NODE_ENV=production
   ```

4. **Deploy**
   - Click "Save and Deploy"
   - Your app will be available at `https://your-project.pages.dev`

### Method 2: Direct Upload (Wrangler CLI)

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler auth login
   ```

2. **Deploy**
   ```bash
   npm run build:ui
   npx wrangler pages deploy dist-ui --project-name=jsonderulo-pipeline-ui
   ```

## Build Configuration

The application is optimized for Cloudflare Pages with:

### Performance Optimizations
- **Code splitting**: Vendor, charts, and flow libraries are split into separate chunks
- **Minification**: Terser minification for optimal bundle size
- **Asset optimization**: Static assets are optimized and fingerprinted

### Security Headers
Configured in `ui/public/_headers`:
- XSS Protection
- Content Type Options
- Frame Options
- Referrer Policy

### Routing Configuration
SPA routing handled in `ui/public/_redirects`:
- All routes fallback to `index.html`
- API proxy configuration for backend integration

## Environment Configuration

### Production Environment Variables

Set in Cloudflare Pages dashboard under **Settings > Environment Variables**:

```
NODE_ENV=production
VITE_API_BASE_URL=https://your-api-domain.com
```

### Backend Integration

Update `ui/public/_redirects` with your actual backend URL:
```
/api/*  https://your-backend-domain.com/api/:splat  200
```

## Custom Domain Setup

1. **Add Custom Domain**
   - Go to your Pages project dashboard
   - Click "Custom domains"
   - Add your domain (e.g., `pipeline.jsonderulo.com`)

2. **DNS Configuration**
   - Add CNAME record: `pipeline CNAME your-project.pages.dev`
   - Or use Cloudflare DNS for automatic configuration

## Performance Monitoring

### Build Analytics
- Monitor build times in Cloudflare Pages dashboard
- Check bundle size reports in build logs
- Use Lighthouse for performance auditing

### Runtime Monitoring
- Enable Web Analytics in Cloudflare Pages
- Monitor Core Web Vitals
- Set up error tracking (Sentry integration available)

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check TypeScript errors
cd ui && npx tsc --noEmit

# Test build locally
npm run build:ui
```

**Routing Issues:**
- Ensure `_redirects` file is in `ui/public/`
- Check SPA routing configuration

**API Connection Issues:**
- Verify backend URL in `_redirects`
- Check CORS configuration on backend
- Update environment variables

### Build Size Optimization

If build warnings about chunk size:
```javascript
// In vite.config.ts, adjust chunkSizeWarningLimit
build: {
  chunkSizeWarningLimit: 1000, // Increase if needed
}
```

## Deployment Checklist

- [ ] Code is committed to Git repository
- [ ] Build passes locally (`npm run build:ui`)
- [ ] TypeScript compiles without errors
- [ ] Environment variables configured
- [ ] Custom domain configured (if needed)
- [ ] SSL certificate is active
- [ ] API backend is deployed and accessible
- [ ] _redirects file includes correct backend URL

## Continuous Deployment

Cloudflare Pages automatically redeploys when you push to your connected Git branch:

1. **Automatic Deployments**
   - Push to main/master branch triggers production deployment
   - Preview deployments for pull requests
   - Branch-based deployments for staging

2. **Build Hooks**
   - Set up webhooks for external triggers
   - API-triggered deployments available

## Post-Deployment

1. **Test All Features**
   - Pipeline Builder drag-and-drop functionality
   - Real-time monitoring updates
   - Schema designer validation
   - Testing interface execution
   - Analytics visualizations

2. **Performance Check**
   - Run Lighthouse audit
   - Check loading times across different devices
   - Verify API integration functionality

3. **Monitor**
   - Check Cloudflare Analytics
   - Monitor error rates
   - Set up alerting for downtime

## Support

- **Cloudflare Pages Docs**: https://developers.cloudflare.com/pages/
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **React Router**: https://reactrouter.com/en/main/routers/create-browser-router

---

Your jsonderulo Pipeline UI is now ready for production deployment on Cloudflare Pages! 🚀