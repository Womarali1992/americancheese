# Plan: Tasks Page Vertical Consolidation

## Overview
Reduce vertical space between page top and first category cards by merging the standalone breadcrumb bar into the tasks header card and tightening spacing on the project info card.

## Scope
- **Single file**: `americancheese/client/src/pages/tasks/index.tsx`
- **No API/schema/component changes**
- **CSS-only + JSX restructuring**

## Tasks

### Task 1: Move breadcrumbs into the header card
- **Remove** the standalone breadcrumb `<div>` (lines 1685-1749) that sits above the header card
- **Add** breadcrumbs as a second row inside the header card container (`bg-white border border-slate-200 rounded-lg`), directly after the hover dropdown section (line ~1939)
- Use a subtle `border-t border-slate-100 px-3 py-2` separator
- Breadcrumb content is identical - just relocated inside the card

### Task 2: Tighten project info card spacing
- Outer container: `mb-4` → `mb-2`
- Body section: `p-4` → `p-3`
- Header section: `py-3` → `py-2`

### Task 3: Clean up unused import
- Remove `ArrowLeft` from the lucide-react import if no longer referenced

## Current Phase: plan
## Last Updated: 2026-02-13
