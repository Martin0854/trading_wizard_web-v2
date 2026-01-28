#!/bin/sh
set -e

# Replace environment variable placeholders in JS files at runtime
# This allows setting VITE_* variables via container environment

JS_DIR="/usr/share/nginx/html/assets"

echo "Starting environment injection..."

# Replace placeholders with actual environment values (with defaults)
API_URL="${VITE_API_URL:-https://trading.kalee-dc.click}"
PORTAL_URL="${VITE_PORTAL_URL:-https://trading.kalee-dc.click}"
DAILY_FOCUS_URL="${VITE_DAILY_FOCUS_URL:-https://trading.kalee-dc.click/daily-focus}"
PORTFOLIO_URL="${VITE_PORTFOLIO_URL:-https://trading.kalee-dc.click/portfolio}"

echo "  VITE_API_URL = $API_URL"
echo "  VITE_PORTAL_URL = $PORTAL_URL"
echo "  VITE_DAILY_FOCUS_URL = $DAILY_FOCUS_URL"
echo "  VITE_PORTFOLIO_URL = $PORTFOLIO_URL"

# Replace in all JS files
for js_file in "$JS_DIR"/*.js; do
    if [ -f "$js_file" ]; then
        sed -i "s|__VITE_API_URL__|${API_URL}|g" "$js_file"
        sed -i "s|__VITE_PORTAL_URL__|${PORTAL_URL}|g" "$js_file"
        sed -i "s|__VITE_DAILY_FOCUS_URL__|${DAILY_FOCUS_URL}|g" "$js_file"
        sed -i "s|__VITE_PORTFOLIO_URL__|${PORTFOLIO_URL}|g" "$js_file"
    fi
done

echo "Environment injection complete"

# Start nginx
exec nginx -g "daemon off;"
