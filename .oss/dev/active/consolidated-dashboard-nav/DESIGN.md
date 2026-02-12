# Design: Consolidated Dashboard Navigation

## Problem
The dashboard has 3 horizontal bars before content:
1. **TopNav** - Logo, global search, nav tabs (Dashboard|Tasks|Calendar|Materials|Contacts), bell, avatar
2. **Page Header** - Building icon, "Dashboard" title, stats pills, search, filter, New Project button
3. **Project tabs** - Horizontal scrollable project navigation

The page header is redundant with the TopNav - the "Dashboard" title repeats the active tab, and having two search bars is confusing.

## Solution: Stats Pills AS Navigation

Replace the traditional nav tabs with interactive stats pills on the dashboard page. Each pill shows a live count AND navigates to that section when clicked.

### Before (3 rows)
```
Row 1: [Logo] SiteSetups  [Global Search]  Dashboard|Tasks|Calendar|Materials|Contacts  [Bell][Avatar]
Row 2: [Building] Dashboard  (12 Proj)(396 Tasks)(0 Pend)  [Search] [Filter] [+New Project]
Row 3: [Project folder tabs...]
```

### After (1 row + content)
```
Row 1: [Logo] SiteSetups  (12 Projects)(396 Tasks)(X Events)(0 Materials)(24 Contacts)  [Search projects...] [All v] [+New] [Bell][Avatar]
Row 2: [Project folder tabs...]
```

## Detailed Layout

### TopNav Enhanced (Dashboard view)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                 │
│  [Logo] SiteSetups    (12 Projects) (396 Tasks) (X Events) (0 Materials) (24 Contacts)    [Search...] [All v] [+ New] [Bell] [Avatar]  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Left zone**: Logo + brand name (unchanged)
**Center zone**: 5 stats pills replacing the traditional nav tabs
**Right zone**: Context-aware search + filter + primary action + bell + avatar

### Stats Pill Design

Each pill is a clickable navigation element:

```
┌─────────────────┐
│ [icon] 12 Projects │  ← rounded-full, border, shadow-sm
└─────────────────┘
```

- **Active pill** (current page): `bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold`
- **Inactive pill**: `bg-white border-slate-200 text-slate-600 hover:bg-slate-50`
- **Icon**: Small colored icon per section (Building=indigo, CheckSquare=green, Calendar=cyan, Package=orange, Users=slate)
- **Count**: `text-sm font-semibold`
- **Label**: `text-xs text-slate-500` (or inherits active color)

### Pill Definitions

| Pill | Icon | Count Source | Navigates To | Color |
|------|------|-------------|--------------|-------|
| Projects | Building | `projects.length` | `/` (dashboard) | indigo |
| Tasks | CheckSquare | `openTasks.length` | `/tasks` | green |
| Events | Calendar | upcoming events count | `/calendar` | cyan |
| Materials | Package | pending materials count | `/materials` | orange |
| Contacts | Users | `contacts.length` | `/contacts` | slate |

### Context-Aware Right Zone

When on Dashboard, the right zone shows:
- **Search**: `[Search projects...]` - filters projects on the dashboard
- **Filter**: `[All Projects v]` - status filter dropdown (All, Active, Completed, On Hold, Planning)
- **Action**: `[+ New Project]` - primary CTA button

When on OTHER pages (non-dashboard), TopNav reverts to standard layout with traditional nav tabs.

### Mobile Behavior

**No changes to mobile** - MobileHeader + BottomNav pattern stays as-is. The consolidated design is desktop-only (hidden on `md:` breakpoint and below). Mobile already has a good compact layout.

## Technical Approach

### Files to Modify

1. **`TopNav.tsx`** - Accept optional slots for pill navigation and context actions
2. **`dashboard/index.tsx`** - Remove page header section, pass pills + actions to TopNav via context/props
3. **`Layout.tsx`** - May need to forward page-specific nav content to TopNav

### Implementation Pattern

Use React Context or render props to let the dashboard page inject content into TopNav:

```
DashboardPage
  └─ sets NavContext: { pills: [...], search: ..., actions: [...] }
      └─ TopNav reads NavContext
          └─ If pills exist: render pills instead of standard tabs
          └─ If actions exist: render actions instead of global search
```

### What Gets Removed

- Dashboard page header block (`<div>` with Building icon, title, subtitle, metrics, controls)
- Mobile metrics bar below dashboard header (pills handle this now)
- Global search component from TopNav when on dashboard (replaced by context-aware search)

### What Gets Added

- `NavContext` (or similar) for page-to-nav communication
- `NavPill` component - clickable stat pill with active state
- Conditional rendering in TopNav based on current page

## Scope

**In scope:**
- Dashboard page consolidation only
- Stats pills as navigation (all 5 sections)
- Context-aware search/filter/action in nav
- Desktop only (md: breakpoint and up)

**Out of scope:**
- Other page headers (Tasks, Materials, etc. keep their current headers)
- Mobile navigation changes
- New data fetching (reuse existing query hooks for counts)

## Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Dashboard only | Other pages work fine, minimize risk |
| Search | Single smart search | Reduces confusion, one search to learn |
| Stats pills | All 5 sections | Consistent navigation, no gaps |
| Actions | Context-aware in nav | Eliminates the second row entirely |
| Mobile | No changes | Mobile layout already works well |
| Communication | React Context | Clean separation, no prop drilling through Layout |

## Last Updated
2026-02-12 by /oss:ideate
