# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Development Server:**
```bash
npm run dev         # Start development server with hot reload on port 5000
```

**Building:**
```bash
npm run build       # Build for production (client + server)
npm run start       # Start production server
```

**Database:**
```bash
npm run db:push     # Push database schema changes using Drizzle Kit
```

**Type Checking:**
```bash
npm run check       # Run TypeScript type checking
```

**Clean Export:**
```bash
node export-clean.js  # Create clean code export without Replit layers
```

## Architecture Overview

This is a full-stack project management platform built for construction and general project management.

**Tech Stack:**
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Radix UI components, Wouter router
- **Backend**: Node.js + Express, TypeScript (ESM modules), session-based auth
- **Database**: PostgreSQL with Drizzle ORM
- **Build**: Vite for frontend, esbuild for backend

**Key Directories:**
- `client/src/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared types and schemas (Drizzle + Zod)
- `migrations/` - Database migration files

## Core Data Models

The application is built around these main entities (see `shared/schema.ts`):

**Projects** - Main organizational unit with color themes, category presets, task templates
**Tasks** - 3-tier categorization system (tier1: Structural/Systems/Sheathing/Finishings → tier2: Foundation/Framing/Electrical/etc.)
**Materials** - Linked to projects/tasks with supplier tracking, quotes, cost management
**Labor** - Time tracking, cost calculation, linked to contacts and tasks
**Contacts** - Suppliers, contractors, consultants with role-based categorization

**Important**: The system uses a sophisticated 3-tier category system throughout - always respect the tier1Category/tier2Category structure when working with tasks, materials, or labor.

## Architecture Patterns

**Database Relations:**
- Projects have tasks, materials, labor entries, and contacts
- Tasks can have subtasks, materials, checklist items, and attachments
- Materials track suppliers, quotes, and link to multiple tasks
- Labor entries reference contacts and tasks for time/cost tracking

**Frontend Organization:**
- Pages in `client/src/pages/` follow route structure
- Reusable components in `client/src/components/` organized by domain
- UI primitives in `client/src/components/ui/`
- Both complex and simplified versions exist (prefer Simple* variants when available)

**API Structure:**
- RESTful API in `server/routes.ts`
- Category management in `server/category-routes.ts`
- Authentication via `server/auth.ts`
- Database access via Drizzle ORM in `server/db.ts`

## Special Features

**Template System**: 100+ construction task templates with hierarchical categorization
**Theme System**: Global and project-specific color themes with intelligent color application
**n8n Integration**: Webhook endpoint for automated material imports (`/api/projects/:id/materials/import-n8n`)
**Category Presets**: Database-driven category system for different project types (Home Builder, Commercial, etc.)
**File Attachments**: Base64-encoded file storage for task attachments

## Database Setup

This application uses PostgreSQL with Drizzle ORM. For initial setup:

### PostgreSQL Installation (Windows)
```bash
# Install PostgreSQL via winget
winget install PostgreSQL.PostgreSQL.17

# Start PostgreSQL service (run as administrator if needed)
net start postgresql-x64-17

# Create the database
export PGPASSWORD=your_password_here
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -h localhost -d postgres -c "CREATE DATABASE project_management;"
```

### Environment Configuration
Create/update `.env` with your PostgreSQL credentials:
```env
# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=project_management
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### Schema Migration
```bash
# Apply database schema using Drizzle Kit
npm run db:push

# If prompted about table creation/rename, choose:
# + categories                       create table (press Enter)
```

### Troubleshooting
- If you get SSL connection errors, the Drizzle config already has `ssl: false` for local development
- If you get "address already in use" errors, kill existing processes: `taskkill //PID <process_id> //F`
- If database connection fails, verify PostgreSQL service is running: `sc query postgresql-x64-17`

## Development Notes

- Always run `npm run check` before committing to catch TypeScript errors
- Database changes require `npm run db:push` to apply schema updates
- The app serves on port 5000 in both development and production
- Use the simplified components (Simple*) when available - they have cleaner architecture
- Color themes are applied dynamically - check theme utilities in `client/src/lib/`