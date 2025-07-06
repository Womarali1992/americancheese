# Construction Management Application

## Overview

This is a comprehensive construction management application built with modern web technologies. The system manages construction projects, tasks, materials, labor, and suppliers. It features a React frontend with TypeScript, a Node.js/Express backend, and uses PostgreSQL as the database with Drizzle ORM for data access.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **State Management**: React Query (@tanstack/react-query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with custom components
- **Styling**: Tailwind CSS with custom theming support
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based authentication with cookies
- **File Handling**: Multer for file uploads and attachments

### Data Storage Solutions
- **Primary Database**: PostgreSQL for all application data
- **Schema Management**: Drizzle ORM with TypeScript schema definitions
- **Migrations**: Drizzle Kit for database schema migrations
- **File Storage**: Local filesystem for task attachments and material images

## Key Components

### Project Management
- Complete project lifecycle management from planning to completion
- Task template system with 100+ predefined construction task templates
- Hierarchical task categorization (Tier 1: structural, systems, sheathing, finishings)
- Project progress tracking with visual charts and dashboards

### Task Management
- Template-based task creation with standardized construction workflows
- Task status tracking (not_started, in_progress, completed, on_hold)
- Task dependencies and scheduling
- File attachments and documentation support

### Material Management
- Comprehensive material tracking with supplier information
- Material categorization by type, tier, and construction phase
- Cost tracking and budget management
- Integration with supplier contacts and quotes

### Labor Management
- Labor hour tracking by task and project
- Contact management for workers and subcontractors
- Labor cost calculation and reporting
- Integration with project scheduling

### Supplier Management
- Supplier contact database with categorization
- Quote management and comparison
- Material sourcing and procurement tracking
- Supplier performance monitoring

## Data Flow

### Task Template System
1. Templates are defined in `shared/taskTemplates.ts` with hierarchical categories
2. Projects can automatically generate tasks from selected templates
3. Tasks inherit template properties but can be customized per project
4. Template-based tasks maintain reference to original template via `templateId`

### Material Workflow
1. Materials are created and associated with projects and tasks
2. Material costs are tracked for budget analysis
3. Supplier quotes are linked to materials for cost comparison
4. Material status updates flow through to project budget calculations

### Labor Tracking
1. Labor entries are created for specific tasks within projects
2. Hours and costs are aggregated for project and task-level reporting
3. Labor data feeds into project progress and budget calculations
4. Integration with contact management for worker assignments

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **drizzle-orm**: TypeScript ORM for PostgreSQL
- **postgres**: PostgreSQL client for Node.js
- **express**: Web framework for Node.js
- **multer**: File upload handling
- **wouter**: Lightweight React router

### UI Dependencies
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette interface

### Development Dependencies
- **vite**: Frontend build tool and dev server
- **typescript**: Type checking and compilation
- **tsx**: TypeScript execution for scripts
- **drizzle-kit**: Database schema management

## Deployment Strategy

### Database Setup
1. PostgreSQL database provisioned with connection string in `DATABASE_URL`
2. Drizzle schema migrations applied via `drizzle-kit push`
3. Task templates populated via migration scripts

### Application Deployment
1. Frontend built with Vite to `dist/public`
2. Backend compiled with esbuild to `dist/index.js`
3. Single Node.js process serves both API and static files
4. Session storage configured with PostgreSQL session store

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: Environment mode (development/production)
- Session configuration for authentication
- File upload paths for attachments

## Changelog

Changelog:
- July 06, 2025. Fixed phantom categories system and implemented global template management
  - Eliminated phantom "Tier-1" entries (structural, systems, sheathing, finishings)
  - Created dedicated category_templates table with Earth Tone theme defaults
  - Implemented auto-loading of global templates on project creation
  - Added "Load Templates" button for on-demand template loading in project settings
  - Migrated category data to proper template-based architecture
  - Fixed phantom categories for existing projects while preserving user data
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.