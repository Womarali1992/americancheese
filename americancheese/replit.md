# General Project Management Platform

## Overview
This is a comprehensive, multi-purpose project management platform designed to manage projects, tasks, materials, labor, and suppliers across various industries, including construction and software development. Its core purpose is to provide a flexible, customizable system for complete project lifecycle management, task tracking, resource allocation, and supplier integration. The platform aims to streamline project workflows, enhance collaboration, and improve decision-making through comprehensive data management and reporting.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Changes
**2025-01-28**: Major UI/UX Refactoring and Simplification
- **Complete Codebase Simplification**: Refactored complex dashboard and pages to reduce overly complicated design
- **Created Simplified Components**: Built new simplified versions of core pages (SimpleDashboard.tsx, SimpleProjectsPage.tsx, SimpleTasksPage.tsx) with cleaner, more maintainable code
- **Streamlined Design System**: 
  - Created simplified Layout component (SimpleLayout.tsx) with clean navigation
  - Built simple.css for basic color system replacing complex theming
  - Added simple UI components (simple-status-badge.tsx, simple-progress-bar.tsx)
- **Fixed TypeScript Issues**: Resolved 16+ LSP diagnostics in dashboard and other critical pages
- **Architecture Improvements**:
  - Removed unnecessary complexity from App.tsx (removed complex theme initialization)
  - Created SimpleApp.tsx as cleaner alternative with basic auth flow
  - Consolidated duplicate functionality and overly complex components
- **UI Design Principles Applied**:
  - Consistent card-based layout for all pages  
  - Mobile-responsive grid systems
  - Clear, readable status badges and progress indicators
  - Simplified color palette with semantic meaning
  - Reduced visual clutter while maintaining functionality
- **Previous cleanup**: Removed legacy AI components that were causing code confusion

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: React Query
- **Routing**: Wouter
- **UI Components**: Radix UI primitives, custom components
- **Styling**: Tailwind CSS with custom theming
- **Build Tool**: Vite
- **UI/UX Decisions**: Adaptable design for mobile and desktop (consistent full-width expandable sections, persistent bottom navigation on mobile). Color theme customization (project-specific and global). Collapsible checklist items and subtasks to reduce visual clutter. Drag-and-drop functionality for subtask reordering and cross-window content export.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Session-based with cookies
- **File Handling**: Multer for uploads
- **Data Storage**: PostgreSQL for all application data; local filesystem for attachments. Drizzle Kit for schema migrations.

### Key Features
- **Project Management**: Full lifecycle management, visual progress tracking, custom project categories.
- **Task Management**: Template-based task creation (100+ construction templates), hierarchical categorization (Tier 1: structural, systems, sheathing, finishings), status tracking, dependencies, scheduling, and attachments.
- **Material Management**: Tracking, categorization, cost management, supplier integration, and quote comparison.
- **Labor Management**: Hour tracking by task/project, contact management, cost calculation, integrated into contacts tab.
- **Supplier Management**: Contact database, quote management, material sourcing, performance monitoring.
- **Category System**: Flexible, database-driven category system with global templates, eliminating phantom categories. Category description editing.

### System Design Choices
- **Data Flow**: Task templates generate project tasks. Materials link to projects/tasks, influencing budgets. Labor entries aggregate for project reporting.
- **Theming**: Robust theme application with intelligent lookup and global toggle functionality.
- **Modularity**: Components designed for reusability (e.g., `CommentableDescription`, `CategoryDescriptionEditor`).
- **User Experience**: Emphasis on intuitive interactions (e.g., expanded clickable areas for subtasks, clear drag affordances, simplified header layouts).

## External Dependencies

### Core
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: TypeScript ORM for PostgreSQL
- **postgres**: PostgreSQL client
- **express**: Node.js web framework
- **multer**: File upload handling
- **wouter**: Lightweight React router

### UI
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette interface

### Development
- **vite**: Frontend build tool
- **typescript**: Type checking
- **tsx**: TypeScript execution
- **drizzle-kit**: Database schema management