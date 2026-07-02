#!/bin/bash
PB_URL="https://hamilton-family-db.fly.dev"
ADMIN_EMAIL="marty@buildu.io"
ADMIN_PASSWORD="vezzaM-kiwdef-9cyzfu"

TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

CHORES=$(curl -s -X GET "$PB_URL/api/collections/chores/records" -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; items=json.load(sys.stdin)['items']; print('\n'.join([f\"{c['id']}|{c['chore_name']}\" for c in items]))")

echo "$CHORES" | while IFS='|' read -r ID NAME; do
  if [[ "$NAME" == "B Time" ]]; then
    echo "Fixing B Time -> Ben (x5r3x55wyf1p1wj)"
    curl -s -X PATCH "$PB_URL/api/collections/chores/records/$ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"assigned_to":"x5r3x55wyf1p1wj"}'
  fi
  if [[ "$NAME" == *"Set Table"* ]]; then
    echo "Fixing Set Table -> Arthur (4vip8uiurrnghst)"
    curl -s -X PATCH "$PB_URL/api/collections/chores/records/$ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"assigned_to":"4vip8uiurrnghst"}'
  fi
  if [[ "$NAME" == *"Dishes - Unload & Load"* ]]; then
    echo "Fixing Dishes -> Pepper (47tmgbnhln6wu2n)"
    curl -s -X PATCH "$PB_URL/api/collections/chores/records/$ID" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"assigned_to":"47tmgbnhln6wu2n"}'
  fi
done

echo "Done"
