#!/bin/bash
# Creates all Family Dashboard collections in PocketBase via the REST API.
# Fill in your admin credentials below, then run:
#   chmod +x setup_pocketbase.sh && ./setup_pocketbase.sh

PB_URL="https://hamilton-family-db.fly.dev"
ADMIN_EMAIL="marty@buildu.io"
ADMIN_PASSWORD="vezzaM-kiwdef-9cyzfu"

echo "🔐 Authenticating with PocketBase..."
TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed. Check your email/password."
  exit 1
fi
echo "✅ Authenticated!"

create_collection() {
  local NAME=$1
  local BODY=$2
  echo "📦 Creating collection: $NAME..."
  RESULT=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$PB_URL/api/collections" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY")
  if [ "$RESULT" == "200" ]; then
    echo "   ✅ $NAME created!"
  else
    echo "   ⚠️  $NAME returned HTTP $RESULT (may already exist)"
  fi
}

# ── PROFILES ────────────────────────────────────────────────────────────────
create_collection "profiles" '{
  "name": "profiles",
  "type": "base",
  "listRule": "",
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "schema": [
    {"name": "name",       "type": "text",   "required": true,  "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "xp_balance", "type": "number", "required": false, "options": {"min": 0, "max": null, "noDecimal": true}},
    {"name": "is_op",      "type": "bool",   "required": false, "options": {}},
    {"name": "is_parent",  "type": "bool",   "required": false, "options": {}},
    {"name": "birthday",   "type": "text",   "required": false, "options": {"min": null, "max": null, "pattern": ""}}
  ]
}'

# ── CHORES ───────────────────────────────────────────────────────────────────
create_collection "chores" '{
  "name": "chores",
  "type": "base",
  "listRule": "",
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "schema": [
    {"name": "chore_name",      "type": "text",   "required": true,  "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "assigned_to",     "type": "text",   "required": false, "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "is_completed",    "type": "bool",   "required": false, "options": {}},
    {"name": "xp_reward",       "type": "number", "required": false, "options": {"min": 0, "max": null, "noDecimal": true}},
    {"name": "frequency",       "type": "select", "required": false, "options": {"maxSelect": 1,  "values": ["daily","weekly","monthly"]}},
    {"name": "due_dates",       "type": "select", "required": false, "options": {"maxSelect": 10, "values": ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31"]}},
    {"name": "round_robin_pool","type": "select", "required": false, "options": {"maxSelect": 10, "values": []}}
  ]
}'

# ── EVENTS ────────────────────────────────────────────────────────────────────
create_collection "events" '{
  "name": "events",
  "type": "base",
  "listRule": "",
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "schema": [
    {"name": "title",    "type": "text", "required": true,  "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "date",     "type": "text", "required": false, "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "assignee", "type": "text", "required": false, "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "color",    "type": "text", "required": false, "options": {"min": null, "max": null, "pattern": ""}}
  ]
}'

# ── MEALS ─────────────────────────────────────────────────────────────────────
create_collection "meals" '{
  "name": "meals",
  "type": "base",
  "listRule": "",
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "schema": [
    {"name": "day",       "type": "text", "required": true,  "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "main_dish", "type": "text", "required": false, "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "side_dish", "type": "text", "required": false, "options": {"min": null, "max": null, "pattern": ""}}
  ]
}'

# ── GROCERIES ─────────────────────────────────────────────────────────────────
create_collection "groceries" '{
  "name": "groceries",
  "type": "base",
  "listRule": "",
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "schema": [
    {"name": "name",       "type": "text", "required": true,  "options": {"min": null, "max": null, "pattern": ""}},
    {"name": "is_checked", "type": "bool", "required": false, "options": {}}
  ]
}
'

# ── PHOTOS ────────────────────────────────────────────────────────────────────
create_collection "photos" '{
  "name": "photos",
  "type": "base",
  "listRule": "",
  "viewRule": "",
  "createRule": "",
  "updateRule": "",
  "deleteRule": "",
  "schema": [
    {
      "name": "photo",
      "type": "file",
      "required": true,
      "options": {
        "maxSelect": 1,
        "maxSize": 10485760,
        "mimeTypes": ["image/jpeg", "image/png", "image/svg+xml", "image/gif", "image/webp"]
      }
    }
  ]
}'

echo ""
echo "🎉 Done! Open https://hamilton-family-db.fly.dev/_/ to verify your collections."
echo "   Don't forget to add your profile names to the round_robin_pool select options!"
