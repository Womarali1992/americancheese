# General Project Management Platform

## Overview

This is a comprehensive project management platform built with modern web technologies. The system can be used for various types of projects including construction development, software development, and other project types. It manages projects, tasks, materials, labor, and suppliers with a flexible category system. The platform features a React frontend with TypeScript, a Node.js/Express backend, and uses PostgreSQL as the database with Drizzle ORM for data access.

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
- July 12, 2025. Improved task page header layout organization
  - Removed redundant "Select Tasks" button to reduce header clutter
  - Made dropdown selectors more compact (reduced max widths)
  - Implemented clean two-row layout for mobile devices
  - Reorganized filters into logical groupings with proper spacing
  - Enhanced mobile responsiveness with side-by-side filter controls
  - Shortened "Select Categories" button label to "Categories" for better fit
- July 10, 2025. Added export subtask feature to CommentableDescription component
  - Red-flagged sections are automatically removed from export
  - Comments replace original text when present in exported content
  - Yellow-flagged (caution) sections keep original text and ignore comments on export
  - Export button copies processed subtask content to clipboard
  - Feature integrated into SubtaskManager with green export button
  - Added toast notifications for successful export or error handling
  - Implemented fallback clipboard functionality for older browsers
  - Updated export function to preserve original formatting and indentation
  - Optimized comment polling to reduce API calls from 2s to 10s intervals
- July 09, 2025. Successfully moved labor management from standalone page to contacts tab
  - Integrated labor functionality into contacts page as "Labor Management" tab
  - Added comprehensive labor management component with search, filtering, and CRUD operations
  - Fixed all dashboard links from old /labor route to /contacts?tab=labor
  - Added URL parameter support to automatically switch to labor tab when ?tab=labor is present
  - Implemented redirect route for legacy /labor URLs to ensure seamless navigation
  - Removed standalone labor route from App.tsx while preserving all functionality
- July 08, 2025. Fixed subtask section combining persistence issue after page refresh
  - Root cause: Section indices became invalid after combining due to text structure changes
  - Implemented complete section state reset after combining operations
  - Updated combineSections function to reset all section states except combined section 0
  - Added proper database state clearing to prevent accumulation of invalid indices
  - System now correctly handles section combining with full persistence through page refreshes
  - All three features (commenting, flagging, combining) now maintain proper database persistence
- July 08, 2025. Fixed critical theme application bug in applyGlobalThemeToProject function
  - Resolved function signature mismatch preventing project-specific theme application
  - Updated function to accept both ColorTheme objects and theme name strings
  - Added intelligent theme lookup using COLOR_THEMES registry with fallback handling
  - Implemented multiple matching strategies for theme resolution (exact match, partial match)
  - Added comprehensive error handling with fallback to Earth Tone theme
  - Both global and project-specific theme functionality now working correctly
- July 08, 2025. Fixed global theme toggle functionality in project theme settings
  - Resolved state management issue where toggle would revert when clicked
  - Updated mutation success handler to properly sync local state with server response
  - Added error handling to reset state if toggle operations fail
  - Added protection against race conditions during theme update mutations
  - Component now correctly tracks useGlobalTheme field from database
- July 06, 2025. Fixed contact form to use project-specific categories instead of hardcoded categories
  - Updated CreateContactDialog to accept projectId parameter and use project-specific categories
  - Modified contacts page to pass current project filter to contact form
  - Form now dynamically loads categories from selected project's actual tier1/tier2 structure
  - Removed hardcoded category arrays in favor of database-driven category selection
  - Added fallback logic to use first project's categories if no specific project is selected
- July 06, 2025. Fixed phantom categories system and implemented global template management
  - Eliminated phantom "Tier-1" entries (structural, systems, sheathing, finishings)
  - Created dedicated category_templates table with Earth Tone theme defaults
  - Implemented auto-loading of global templates on project creation
  - Added "Load Templates" button for on-demand template loading in project settings
  - Migrated category data to proper template-based architecture
  - Fixed phantom categories for existing projects while preserving user data
  - Resolved CategoryProgressList component to use real database categories instead of hardcoded phantom entries
  - Component now properly displays only actual task categories and template-based categories
- July 04, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.

## Project Clarification

This application is confirmed to be a **General Project Management Platform** that can be used for various project types including construction development, software development, and other project categories. The system provides flexible project management with features for:
- Multi-purpose project management with customizable task templates
- Resource tracking (materials, labor, contacts)
- Supplier management and quotes
- Color theme customization (recently implemented)  
- Admin panel for global settings
- Flexible category system adaptable to different project types