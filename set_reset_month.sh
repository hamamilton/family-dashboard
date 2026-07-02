#!/bin/bash
PB_URL="https://hamilton-family-db.fly.dev"
ADMIN_EMAIL="marty@buildu.io"
ADMIN_PASSWORD="vezzaM-kiwdef-9cyzfu"

TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

update_profile() {
  ID=$1
  curl -s -X PATCH "$PB_URL/api/collections/profiles/records/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"last_reset_month\": \"2026-07\"}" > /dev/null
  echo "Updated $ID"
}

update_profile "47tmgbnhln6wu2n"
update_profile "x5r3x55wyf1p1wj"
update_profile "4vip8uiurrnghst"
update_profile "byyxnpzl37tj9db"
update_profile "shxcmnvk9yxnu0z"
update_profile "yex2g9hp4rzuwia"
