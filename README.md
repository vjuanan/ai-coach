# CV-OS - CrossFit Coach Programming Platform

A high-end, minimalist web application for CrossFit Coaches to design, manage, and distribute training programming.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your Supabase credentials to .env.local
# NEXT_PUBLIC_SUPABASE_URL=your_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# Run development server
npm run dev
```

## Database Setup

Run the migration files in your Supabase SQL editor:

1. `supabase/migrations/001_schema.sql` - Core tables and RLS policies
2. `supabase/migrations/002_seed_exercises.sql` - Exercise library (60+ movements)

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout (dark mode)
│   ├── page.tsx             # Dashboard
│   └── editor/[programId]/  # Mesocycle editor
├── components/
│   ├── app-shell/           # Sidebar, Topbar, CommandPalette
│   ├── editor/              # Canvas editor components
│   └── export/              # PDF/PNG export
├── lib/
│   ├── supabase/            # Client & types
│   └── store/               # Zustand state management
└── supabase/
    └── migrations/          # SQL schema files
```

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth)
- **State**: Zustand with persistence
- **Export**: html2canvas, jsPDF

## Features

- ✅ Dark mode "CV-OS" aesthetic
- ✅ Command Palette (Cmd+K)
- ✅ Context switcher (Athletes/Gyms)
- ✅ 4-week mesocycle canvas editor
- ✅ Polymorphic workout blocks
- ✅ EMOM, AMRAP, RFT, Tabata, Ladder support
- ✅ Draft mode with local persistence
- ✅ Commercial-grade PDF/PNG export
