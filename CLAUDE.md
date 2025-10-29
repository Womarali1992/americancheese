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
npm run check       # Run TypeScript type checking across the project
```

**Clean Export:**
```bash
node export-clean.js  # Create clean code export without Replit layers
```

## Architecture Overview

This is a full-stack construction project management platform built for contractors, builders, and project managers.

**Tech Stack:**
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Radix UI components, Wouter router, TanStack Query
- **Backend**: Node.js + Express, TypeScript (ESM modules), session-based authentication with Passport
- **Database**: PostgreSQL with Drizzle ORM, Drizzle Kit for migrations
- **Build Tools**: Vite for frontend bundling, esbuild for backend compilation
- **Deployment**: Optimized for Replit with special export tool for clean deployment

**Project Structure:**
```
client/src/           # React frontend application
├── components/       # Reusable React components (organized by domain)
├── hooks/           # Custom React hooks (toast, navigation, etc.)
├── lib/             # Utility libraries (color themes, category names, etc.)
├── pages/           # Page components following route structure
└── styles/          # Global styles and Tailwind configuration

server/              # Express.js backend API
├── routes.ts        # Main API routes (RESTful endpoints)
├── category-routes.ts # Category management API
├── auth.ts          # Authentication with Passport local strategy
├── db.ts            # Database connection and initialization
├── storage.ts       # File storage abstraction layer
└── index.ts         # Server entry point

shared/              # Code shared between client and server
├── schema.ts        # Drizzle database schemas and Zod validation
├── taskTemplates.ts # 100+ construction task templates
└── presets.ts       # Category presets for different project types

migrations/          # Drizzle database migrations
utils/              # Standalone utility scripts
```

## Core Data Architecture

The application uses a sophisticated 3-tier categorization system throughout:

**Projects** - Main organizational unit with:
- Color themes (global or project-specific)
- Category presets (Home Builder, Commercial, etc.)
- Template selection for task creation
- Progress tracking and status management

**Tasks** - Core work items with 3-tier categorization:
- **Tier 1**: Structural, Systems, Sheathing, Finishings
- **Tier 2**: Foundation, Framing, Electrical, Plumbing, etc.
- Supports subtasks, checklists, attachments, and comments
- Template-based creation with 100+ predefined construction tasks

**Materials** - Inventory and cost tracking:
- Links to tasks, suppliers, and projects
- Quote management with date tracking
- Cost calculations and budget impact
- n8n webhook integration for automated imports

**Labor** - Time and cost tracking:
- Links to contacts (workers) and tasks
- Hours worked, hourly rates, and cost calculations
- Date range tracking for payroll and project costing

**Contacts** - Suppliers, contractors, and team members:
- Role-based categorization (supplier, contractor, consultant)
- Integration with materials and labor tracking

## Critical Implementation Details

**Always Respect the 3-Tier Category System:**
```typescript
// Correct: Always include both tier levels when working with tasks/materials
{
  tier1Category: "structural",      // Top level: structural/systems/sheathing/finishings  
  tier2Category: "framing"         // Second level: foundation/framing/electrical/plumbing/etc
}
```

**Template System Architecture:**
- 100+ predefined construction task templates in `shared/taskTemplates.ts`
- Template creation creates actual task records, not references
- Projects can have custom template selections stored as arrays of template IDs
- Admin interface allows template category management

**Color Theme System:**
- Global themes in `client/src/lib/color-themes.ts`
- Project-specific theme overrides supported
- Dynamic theme application with CSS custom properties
- Theme utilities in `client/src/lib/color-utils.ts`

**Component Architecture:**
- Use Simple* variants when available (cleaner architecture)
- UI primitives in `client/src/components/ui/`
- Domain-specific components organized by feature area
- Consistent use of Radix UI for accessibility

## API Architecture

**Main Routes (`server/routes.ts`):**
- RESTful API design with proper HTTP methods
- Comprehensive error handling and validation
- File upload support with base64 encoding for attachments
- n8n integration endpoint: `POST /api/projects/:id/materials/import-n8n`

**Category Routes (`server/category-routes.ts`):**
- Admin endpoints for template category management
- Category preset system for different project types

**Authentication (`server/auth.ts`):**
- Passport local strategy with session management
- Cookie-based authentication
- Middleware for protected routes

**Database Layer (`server/db.ts`):**
- Drizzle ORM with PostgreSQL
- Connection pooling and error handling
- Automatic database initialization

## Special Features & Integrations

**n8n Materials Import:**
- Webhook endpoint for automated material imports from external systems
- Comprehensive validation and error handling
- See `N8N_INTEGRATION_README.md` for implementation details
- Test script: `test-n8n-endpoint.js`

**Clean Export System:**
- Removes Replit-specific build layers for clean deployment
- Converts path aliases to relative imports
- See `CLEAN-EXPORT-README.md` for usage details
- Run with: `node export-clean.js`

**File Attachment System:**
- Base64-encoded file storage for task attachments
- 50MB request size limit for large images
- Stored directly in database for simplicity

## Development Workflow

**Before Committing:**
1. Run `npm run check` to verify TypeScript compilation
2. Test database schema changes with `npm run db:push`
3. Verify the development server starts without errors

**Working with Database:**
- Schema changes go in `shared/schema.ts`
- Use `npm run db:push` to apply changes (creates migrations automatically)
- All tables use Drizzle ORM with Zod validation schemas

**Component Development:**
- Follow existing patterns in `client/src/components/`
- Prefer Simple* component variants when available
- Use proper TypeScript typing with shared schemas
- Respect the 3-tier categorization system in all UI components

**API Development:**
- Add new routes to `server/routes.ts` or create feature-specific route files
- Use Zod schemas from `shared/schema.ts` for validation
- Include proper error handling and HTTP status codes
- Test with the development server running on port 5000