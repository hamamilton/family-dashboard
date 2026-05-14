# ⚡️ Family Dashboard (Hamilton Node)

A high-performance, gamified family management system built with a "Cyber-Industrial" aesthetic. This application serves as the central command hub for chores, scheduling, and family coordination.

![Dashboard Preview](https://hub.hamiltonmarty.com/preview.png) *(Placeholder - replace with actual screenshot)*

## 🚀 Tech Stack

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS + Custom "Cyberpunk" CSS tokens
- **Backend:** [PocketBase](https://pocketbase.io/) (Self-hosted Go backend)
- **Infrastructure:** 
  - **Database:** Fly.io (with 1GB encrypted persistent volume)
  - **Frontend:** Vercel (CI/CD)
- **Realtime:** PocketBase SDK (SSE) for instant cross-device syncing

---

## 🛠 Features

### 🎮 Gamified Mission Board
- **Chore Tracking:** Chores are presented as "Missions" with XP rewards.
- **Round-Robin Rotation:** Integrated logic automatically rotates chores between family members in a defined pool.
- **Recurrence Engine:** Support for Daily, Weekly (select days), and Monthly (select dates) recurrence.
- **XP System:** Visual reward bars tracking XP toward a 1000 XP goal.
- **OP Status:** "Over-Powered" status for parents (Mom/Dad) with distinctive gold/amber UI glows.

### 📅 Family Intelligence
- **Family Calendar:** Realtime event coordination with participant-specific color coding.
- **Meal Planner:** Weekly rotation of main and side dishes.
- **Grocery Intel:** Collaborative shopping list with instant cross-device updates.
- **Weather Widget:** Integrated local conditions via OpenWeather API.
- **Rest Day Protocols:** Automatic chore suspension for Birthdays and Public Holidays (with 1.5x XP multipliers).

### 🔐 Command Center (Admin Panel)
- Built-in secure admin panel (Shield icon) for database management.
- Create/Edit/Delete chores directly from the dashboard.
- Full control over Round-Robin pools and recurrence schedules.

---

## 🏗 Project Structure

```text
├── pocketbase/            # Fly.io deployment configuration
│   └── fly.toml           # Database infrastructure settings
├── src/
│   ├── components/
│   │   ├── features/      # Modular functional components (Admin, Chores, etc.)
│   │   ├── layout/        # Global layout (Header, Nav)
│   │   └── views/         # Large-scale layout views (Calendar, Grid)
│   ├── hooks/             # Custom React hooks for business logic & PB sync
│   ├── lib/               # Shared libraries (PocketBase client config)
│   └── index.css          # Core "Cyber-Industrial" design system
├── setup_pocketbase.sh    # Automation script for DB schema initialization
└── pb_schema.json         # Master database schema definition
```

---

## 📂 Database Schema (PocketBase)

The backend consists of five primary collections:

1. **`profiles`**: Family member records (Name, XP, Birthday, OP status).
2. **`chores`**: The mission list.
   - `assigned_to`: Relation to `profiles`.
   - `round_robin_pool`: Multi-relation to `profiles` for rotation.
   - `frequency`: Enum (daily, weekly, monthly).
3. **`events`**: Calendar data (Title, Date, Assignee, Color).
4. **`meals`**: Weekly menu data (Day, Main, Side).
5. **`groceries`**: Checklist items for the family.

---

## 🛠 Development & Deployment

### Local Setup
1. Clone the repository.
2. Run `npm install`.
3. Create `.env.local` with `VITE_POCKETBASE_URL`.
4. Run `npm run dev`.

### Deployment Logic
- **Database:** Deploy via `fly deploy` from the `/pocketbase` directory. Data is stored on a persistent volume at `/pb/pb_data`.
- **Frontend:** Auto-deployed to Vercel on every git push.

---

## 🛰 Production Nodes
- **Dashboard:** [hub.hamiltonmarty.com](https://hub.hamiltonmarty.com)
- **Database Admin:** [hamilton-family-db.fly.dev/_/](https://hamilton-family-db.fly.dev/_/)
