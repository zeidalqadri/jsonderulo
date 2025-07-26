#!/bin/bash

# jsonderulo Pipeline UI Deployment Script for Cloudflare Pages

set -e

echo "🚀 Starting jsonderulo Pipeline UI deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Run type check
echo -e "${YELLOW}🔍 Type checking...${NC}"
cd ui && npx tsc --noEmit && cd ..

# Build the UI
echo -e "${YELLOW}🏗️  Building UI for production...${NC}"
npm run build:ui

# Check if build was successful
if [ ! -d "dist-ui" ]; then
    echo -e "${RED}❌ Build failed - dist-ui directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"

# Display build info
echo -e "${YELLOW}📊 Build Information:${NC}"
echo "Build output: $(pwd)/dist-ui"
echo "Build size: $(du -sh dist-ui | cut -f1)"
echo "Files created:"
ls -la dist-ui/

echo ""
echo -e "${GREEN}🎉 Build complete! Ready for Cloudflare Pages deployment.${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Commit and push your changes to your Git repository"
echo "2. Go to Cloudflare Pages dashboard"
echo "3. Connect your repository and deploy"
echo ""
echo -e "${YELLOW}Or deploy using Wrangler CLI:${NC}"
echo "npx wrangler pages deploy dist-ui --project-name=jsonderulo-pipeline-ui"

# Optional: Test the build locally
read -p "🔍 Test the build locally? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🌐 Starting local preview server...${NC}"
    npx vite preview --outDir=dist-ui --port=4173 &
    SERVER_PID=$!
    echo "Preview server running at http://localhost:4173"
    echo "Press any key to stop the preview server..."
    read -n 1 -s
    kill $SERVER_PID
    echo -e "${GREEN}Preview server stopped.${NC}"
fi

echo -e "${GREEN}🚀 Deployment preparation complete!${NC}"