#!/bin/bash
PB_URL="https://hamilton-family-db.fly.dev"
ADMIN_EMAIL="marty@buildu.io"
ADMIN_PASSWORD="vezzaM-kiwdef-9cyzfu"

TOKEN=$(curl -s -X POST "$PB_URL/api/admins/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

curl -s -X PATCH "$PB_URL/api/collections/chores" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schema": [
  {
    "system": false,
    "id": "iahh4uep",
    "name": "chore_name",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "pattern": ""
    }
  },
  {
    "system": false,
    "id": "zydwfhyk",
    "name": "assigned_to",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "39x9emrfiyoxrtr",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 10,
      "displayFields": [
        "name"
      ]
    }
  },
  {
    "system": false,
    "id": "1d13uoro",
    "name": "is_completed",
    "type": "bool",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {}
  },
  {
    "system": false,
    "id": "kou1w3xi",
    "name": "xp_reward",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 0,
      "max": null,
      "noDecimal": true
    }
  },
  {
    "system": false,
    "id": "bsw0sugn",
    "name": "frequency",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 1,
      "values": [
        "daily",
        "weekly",
        "monthly",
        "none"
      ]
    }
  },
  {
    "system": false,
    "id": "g91xr9aa",
    "name": "due_dates",
    "type": "select",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "maxSelect": 10,
      "values": [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18",
        "19",
        "20",
        "21",
        "22",
        "23",
        "24",
        "25",
        "26",
        "27",
        "28",
        "29",
        "30",
        "31"
      ]
    }
  },
  {
    "system": false,
    "id": "vleqzfem",
    "name": "round_robin_pool",
    "type": "relation",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "39x9emrfiyoxrtr",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 10,
      "displayFields": [
        "name"
      ]
    }
  },
  {
    "name": "cannot_cover",
    "type": "bool",
    "required": false,
    "options": {}
  },
  {
    "name": "is_skipped",
    "type": "bool",
    "required": false,
    "options": {}
  }
]
  }'
