#!/bin/bash
PB_URL="https://hamilton-family-db.fly.dev"
ADMIN_EMAIL="marty@buildu.io"
ADMIN_PASSWORD="vezzaM-kiwdef-9cyzfu"

TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s -X GET "$PB_URL/api/backups" -H "Authorization: Bearer $TOKEN"
