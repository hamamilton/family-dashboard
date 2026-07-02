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
  NAME=$2
  IS_PARENT=$3
  curl -s -X PATCH "$PB_URL/api/collections/profiles/records/$ID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"$NAME\", \"is_parent\": $IS_PARENT}" > /dev/null
  echo "Restored $NAME"
}

update_profile "47tmgbnhln6wu2n" "Pepper" "false"
update_profile "x5r3x55wyf1p1wj" "Ben" "false"
update_profile "4vip8uiurrnghst" "Arthur" "false"
update_profile "byyxnpzl37tj9db" "Curtis" "false"
update_profile "shxcmnvk9yxnu0z" "Mom" "true"
update_profile "yex2g9hp4rzuwia" "Marty" "true"
