// Cloudflare Pages Functions middleware for SPA routing
export async function onRequestGet(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  
  // Skip middleware for static assets
  if (url.pathname.startsWith('/assets/') || 
      url.pathname.includes('.') && !url.pathname.includes('.html')) {
    return next();
  }
  
  // For HTML requests to non-root paths, serve index.html
  if (url.pathname !== '/' && !url.pathname.startsWith('/api/')) {
    const indexUrl = new URL('/', url.origin);
    return fetch(indexUrl);
  }
  
  return next();
}