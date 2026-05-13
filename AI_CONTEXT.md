# Family Dashboard — AI Development Context

> **Purpose:** This file is a complete handoff document for any AI assistant (Copilot, Claude, etc.) to continue development on this project from any device.

---

## 🏗️ Architecture Overview

This is a **React (Vite) + PocketBase** family dashboard PWA.

| Layer | Technology | Location |
|---|---|---|
| Frontend | React + Vite + TailwindCSS | This repo (`/src`) |
| Hosting | Vercel | `hub.hamiltonmarty.com` |
| Database | PocketBase (self-hosted) | Raspberry Pi on home network |
| DB Tunnel | Ngrok secure tunnel | `https://flogging-campsite-untying.ngrok-free.dev` |
| DB Admin | PocketBase Admin UI | `https://flogging-campsite-untying.ngrok-free.dev/_/` |

---

## 🚀 Deployment Workflow

Every code change requires a redeploy. Run from the project root on Mac:
```bash
vercel build --prod && vercel deploy --prebuilt --prod
```
> **Note:** Git auto-deploy from Vercel is NOT enabled. You must deploy manually via CLI.

---

## 🗄️ PocketBase Collections (Database Schema)

All collections have **open API rules** (no authentication required).

### `profiles`
| Field | Type | Notes |
|---|---|---|
| `name` | Text | Must match exactly — used for chore assignment & profile lookup |
| `xp_balance` | Number | Total XP earned |
| `is_op` | Bool | Auto-set to `true` when xp_balance ≥ 1000. Gives 1.5x XP bonus |
| `is_parent` | Bool | Used for admin UI access (separate from is_op game mechanic!) |
| `birthday` | Text | Format: `MM-DD` (e.g. `05-12`). Triggers birthday rest day |

### `chores`
| Field | Type | Notes |
|---|---|---|
| `chore_name` | Text | Display name of the chore |
| `assigned_to` | Text | Must match a profile `name` exactly |
| `is_completed` | Bool | Checked off state |
| `xp_reward` | Number | XP awarded on completion |
| `frequency` | Select | Options: `daily`, `weekly`, `monthly` |
| `due_dates` | Select (multi) | For weekly: `Monday`–`Sunday`. For monthly: `1`–`31` |
| `round_robin_pool` | Select (multi) | Names to rotate through. Auto-rotates `assigned_to` on reset |

### `events`
| Field | Type | Notes |
|---|---|---|
| `title` | Text | Event display name |
| `date` | Text | ISO datetime string (e.g. `2026-05-12T18:00:00.000Z`) |
| `assignee` | Text | Person this event belongs to |
| `color` | Text | Optional color override |

### `meals`
| Field | Type | Notes |
|---|---|---|
| `day` | Text | Day name (e.g. `Monday`) |
| `main_dish` | Text | Main course |
| `side_dish` | Text | Side dish |

### `groceries`
| Field | Type | Notes |
|---|---|---|
| `name` | Text | Item name |
| `is_checked` | Bool | Checked off state |

---

## 🧩 Features Built

### ✅ Chore Board (Mission Board)
- Grouped by `assigned_to` or chore category (toggle in header)
- Chore cards with cyberpunk cut-corner aesthetic
- Checkbox toggle writes directly to PocketBase (optimistic UI update)
- Late penalty: -15% XP per day overdue (shown as red flashing badge on card)

### ✅ Smart Scheduling Engine (`src/hooks/useChores.js`)
- `daily` → auto-resets every morning
- `weekly` → hidden Mon–Thu, appears on due day(s), persists if overdue
- `monthly` → hidden until due date, supports multiple dates per month
- **Round Robin:** `round_robin_pool` field rotates `assigned_to` automatically on reset

### ✅ XP / Gamification
- Completing a chore awards `xp_reward` XP to the assigned profile
- 1.5x multiplier if profile `is_op` OR if today is a national holiday
- -15% per day late penalty (floors at 10% minimum)
- Reaching 1000 XP sets `is_op = true`

### ✅ Holiday & Birthday Automation (`src/hooks/useChores.js`)
- Fetches US public holidays from `https://date.nager.at/api/v3/PublicHolidays/{year}/US`
- If today is a holiday: banner shown across top of app + 1.5x XP all day
- If today matches a profile's `birthday` (MM-DD): banner shown + their chores replaced with "🎂 Happy Birthday!" card

### ✅ Agent Profiles Panel (`src/components/features/AgentProfiles.jsx`)
- Row of cards — one per profile
- Shows XP balance, progress bar toward 1000 XP, next 3 pending chores
- Color coded per person (cyan, fuchsia, emerald, violet, rose)
- OP status shown in amber/gold with animated glow

### ✅ Family Calendar (`src/components/views/CalendarView.jsx`)
- react-big-calendar with month/week/day views
- Click any day to add an event (modal with title, start/end datetime, assignee)
- Click existing event to edit or delete
- Color coded by family member
- Events stored in PocketBase `events` collection

### ✅ Meal Planner (`src/components/features/MealPlanner.jsx`)
- 7-day week view, editable inline
- Syncs to PocketBase `meals` collection
- "Reset" button with confirmation modal

### ✅ Grocery List (`src/components/features/GroceryList.jsx`)
- Add items, tap to check off, clear checked
- Syncs to PocketBase `groceries` collection

### ✅ Photo Album (`src/components/features/PhotoAlbum.jsx`)
- Stores photos in browser IndexedDB (NOT in PocketBase — no storage cost)

### ✅ Dark/Light Mode
- Cyberpunk aesthetic (dark default)
- Toggle in header, preference saved to localStorage

### ✅ Draggable Layout
- react-grid-layout — panels can be dragged & resized
- Layout saved to localStorage

---

## ⚠️ Known Issues & Important Notes

### Ngrok SSE Blocks (Fixed by Polling)
Ngrok blocks Server-Sent Events (SSE), which PocketBase uses for its realtime API. All `pb.collection().subscribe()` calls have been replaced with `setInterval(..., 30000)` (30-second polling). Do NOT add `.subscribe()` calls — they will always fail through Ngrok.

### PocketBase `ngrok-skip-browser-warning` Header
Added in `src/lib/pocketbase.js` via `pb.beforeSend`. Required for ALL requests to pass through Ngrok without hitting the interstitial page.

### CORS
PocketBase must have `https://hub.hamiltonmarty.com` in its **Settings → Application → CORS allowed origins**. Without this, all write operations fail.

### Field Name Mapping (Calendar)
PocketBase stores calendar events with field `date` and `assignee`. The React calendar component (react-big-calendar) needs `start`, `end`, and `assigned_to`. The mapping is done in `useCalendar.js → fetchEvents`.

### `is_op` vs `is_parent`
- `is_op` = game mechanic (1.5x XP, earned by kids at 1000 XP)
- `is_parent` = UI admin access (only parents)
- **Do NOT use `is_op` for admin gating** — kids can earn it!

---

## 📁 Key File Locations

```
src/
├── lib/pocketbase.js          # PocketBase client + Ngrok bypass header
├── hooks/
│   ├── useChores.js           # Chore data, scheduling engine, XP, holidays, birthdays
│   ├── useCalendar.js         # Calendar events (field mapping: date→start/end, assignee→assigned_to)
│   ├── useMeals.js            # Meal planner data
│   ├── useGroceries.js        # Grocery list data
│   └── useLayout.js           # Draggable panel layout (add new panels here!)
├── components/
│   ├── features/
│   │   ├── AgentProfiles.jsx  # XP cards with next chores per person
│   │   ├── ChoreCard.jsx      # Individual chore card (shows late penalty badge)
│   │   ├── RewardBar.jsx      # XP progress bar (used inside ChoreGrid per person)
│   │   ├── MealPlanner.jsx
│   │   ├── GroceryList.jsx
│   │   ├── PhotoAlbum.jsx
│   │   └── WeatherWidget.jsx
│   ├── views/
│   │   ├── ChoreGrid.jsx      # Groups chores by person/category, birthday logic
│   │   └── CalendarView.jsx   # Full calendar UI + add/edit/delete modal
│   └── layout/
│       └── Header.jsx         # Group-by toggle, dark mode toggle
└── App.jsx                    # Root layout, grid, holiday/birthday banners
```

---

## 🔜 Planned / Discussed Features
- [ ] Parents-only admin UI (using `is_parent` field) for adding/editing chores from the dashboard
- [ ] Holiday events shown automatically on the Family Calendar (from the Nager.at API)
- [ ] Seasonal chores (e.g. specific month ranges only)
- [ ] Push notifications for due chores

---

## 🔑 Important URLs
- **Live App:** https://hub.hamiltonmarty.com
- **Database Admin:** https://flogging-campsite-untying.ngrok-free.dev/_/
- **Vercel Dashboard:** https://vercel.com/marty-hamiltons-projects/family-dashboard
