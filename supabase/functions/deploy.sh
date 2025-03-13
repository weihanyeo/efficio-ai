#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Error: Supabase CLI is not installed.${NC}"
    echo "Please install it first: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're logged in to Supabase
echo -e "${YELLOW}Checking Supabase login status...${NC}"
if ! supabase projects list &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Supabase.${NC}"
    echo "Please run 'supabase login' first."
    exit 1
fi

# Deploy all edge functions
echo -e "${GREEN}Deploying Supabase Edge Functions...${NC}"

# Deploy invite-member function
echo -e "${YELLOW}Deploying invite-member function...${NC}"
if supabase functions deploy invite-member; then
    echo -e "${GREEN}✓ invite-member function deployed successfully!${NC}"
else
    echo -e "${RED}✗ Failed to deploy invite-member function${NC}"
    exit 1
fi

# Set environment variables if needed
echo -e "${YELLOW}Setting environment variables...${NC}"
if [ -f .env ]; then
    source .env
    if [ -n "$PUBLIC_SITE_URL" ]; then
        echo "Setting PUBLIC_SITE_URL environment variable..."
        supabase secrets set PUBLIC_SITE_URL="$PUBLIC_SITE_URL"
    fi
else
    echo -e "${YELLOW}No .env file found. Skipping environment variable setup.${NC}"
    echo "You may need to set the PUBLIC_SITE_URL variable manually:"
    echo "supabase secrets set PUBLIC_SITE_URL=https://your-site-url.com"
fi

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "You can test your function with:"
echo -e "${YELLOW}curl -X POST https://your-project-ref.supabase.co/functions/v1/invite-member \\"
echo -e "  -H \"Authorization: Bearer \$SUPABASE_AUTH_TOKEN\" \\"
echo -e "  -H \"Content-Type: application/json\" \\"
echo -e "  -d '{\"workspace_id\":\"your-workspace-id\",\"role\":\"Member\",\"function\":\"Engineering\"}'${NC}"
