#!/bin/bash
PB_URL="https://hamilton-family-db.fly.dev"
ADMIN_EMAIL="marty@buildu.io"
ADMIN_PASSWORD="vezzaM-kiwdef-9cyzfu"

echo "🔐 Authenticating with PocketBase..."
TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed."
  exit 1
fi

echo "📦 Updating profiles collection..."
curl -s -X PATCH "$PB_URL/api/collections/profiles" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": [
      {"name": "name",       "type": "text",   "required": true,  "options": {"min": null, "max": null, "pattern": ""}},
      {"name": "xp_balance", "type": "number", "required": false, "options": {"min": 0, "max": null, "noDecimal": true}},
      {"name": "is_op",      "type": "bool",   "required": false, "options": {}},
      {"name": "is_parent",  "type": "bool",   "required": false, "options": {}},
      {"name": "birthday",   "type": "text",   "required": false, "options": {"min": null, "max": null, "pattern": ""}},
      {"name": "last_reset_month", "type": "text", "required": false, "options": {"min": null, "max": null, "pattern": ""}}
    ]
  }'

echo -e "\n✅ Done!"
