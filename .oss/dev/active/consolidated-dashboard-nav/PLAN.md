# TDD Implementation Plan: Consolidated Dashboard Navigation

## Overview
Replace the redundant dashboard page header with stats pills that serve as navigation in the TopNav bar. Desktop only, dashboard page only.

## Prerequisites
- Vitest is installed but configured for `node` environment (backend tests only)
- No `@testing-library/react` or `jsdom` currently installed
- Need to set up frontend test infrastructure first

---

## Phase 0: Test Infrastructure Setup

### Task 0.1: Install frontend testing dependencies
**What**: Add `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` to devDependencies
**Why**: Enable React component testing with vitest
**Test**: N/A (infrastructure)
**Files**:
- `americancheese/package.json` - Add devDependencies
- `americancheese/vitest.config.ts` - Add separate project config for client tests with jsdom environment

### Task 0.2: Create vitest setup file for React tests
**What**: Setup file that imports `@testing-library/jest-dom` matchers
**Why**: Enables `.toBeInTheDocument()`, `.toHaveClass()` etc.
**Files**:
- `americancheese/client/src/test/setup.ts` - Setup file

---

## Phase 1: NavContext - Page-to-Nav Communication

### Task 1.1: RED - Test NavContext provides default values
**Behavior**: When no page sets nav content, TopNav should render standard tabs
**Test**: Render a component consuming NavContext → verify pills is empty array, actions is null
**File**: `americancheese/client/src/__tests__/NavContext.test.tsx`

### Task 1.2: GREEN - Implement NavContext
**What**: Create `NavContext` with `NavProvider` and `useNavContext` hook
**Interface**:
```typescript
interface NavPillData {
  id: string;
  icon: LucideIcon;
  count: number;
  label: string;
  navigateTo: string;
  color: string;      // e.g. "indigo", "green", "cyan", "orange", "slate"
  isActive: boolean;
}

interface NavContextValue {
  pills: NavPillData[];
  setPills: (pills: NavPillData[]) => void;
  actions: React.ReactNode | null;
  setActions: (actions: React.ReactNode | null) => void;
  searchComponent: React.ReactNode | null;
  setSearchComponent: (search: React.ReactNode | null) => void;
}
```
**File**: `americancheese/client/src/contexts/NavContext.tsx`

### Task 1.3: RED - Test NavContext accepts page-injected pills
**Behavior**: When a page sets pills via context, the consuming component should see them
**Test**: Render provider → call setPills with 5 pill items → verify consumer receives them

### Task 1.4: GREEN - Make test pass (setPills updates context)

---

## Phase 2: NavPill Component

### Task 2.1: RED - Test NavPill renders count and label
**Behavior**: A nav pill displays an icon, count number, and section label
**Test**: Render NavPill with props `{count: 12, label: "Projects"}` → verify text content shows "12" and "Projects"
**File**: `americancheese/client/src/__tests__/NavPill.test.tsx`

### Task 2.2: GREEN - Implement NavPill component
**What**: Clickable pill with icon, count, label, active/inactive styling
**File**: `americancheese/client/src/components/layout/NavPill.tsx`
**Styling**:
- Active: `bg-{color}-50 border-{color}-200 text-{color}-700 font-semibold`
- Inactive: `bg-white border-slate-200 text-slate-600 hover:bg-slate-50`
- Shape: `rounded-full border shadow-sm px-2.5 py-1`

### Task 2.3: RED - Test NavPill active state styling
**Behavior**: Active pill has distinct background/border color
**Test**: Render NavPill with `isActive=true` → verify it has the active CSS classes

### Task 2.4: GREEN - Implement active state styling

### Task 2.5: RED - Test NavPill click navigates
**Behavior**: Clicking a pill navigates to its target route
**Test**: Render NavPill with `navigateTo="/tasks"` → click → verify navigation hook called with "/tasks"
**Mock**: `useTabNavigation` hook

### Task 2.6: GREEN - Implement click navigation

---

## Phase 3: TopNav Conditional Rendering

### Task 3.1: RED - Test TopNav renders standard tabs when no pills in context
**Behavior**: Default TopNav shows traditional tab navigation (Dashboard, Tasks, etc.)
**Test**: Render TopNav inside empty NavProvider → verify "Dashboard", "Tasks" etc. tab buttons exist
**File**: `americancheese/client/src/__tests__/TopNav.test.tsx`

### Task 3.2: GREEN - Wrap TopNav with NavContext consumer (no-op when empty)

### Task 3.3: RED - Test TopNav renders pills INSTEAD of tabs when pills are set
**Behavior**: When NavContext has pills, render NavPill components instead of tab buttons
**Test**: Set NavContext with 5 pills → render TopNav → verify pills render, standard tabs do NOT render

### Task 3.4: GREEN - Implement conditional rendering in TopNav
**What**: If `pills.length > 0`, render pills row; else render standard tabs
**Keep**: Admin tab, InvitationsBadge, and user avatar always render regardless

### Task 3.5: RED - Test TopNav renders custom actions when set in context
**Behavior**: When NavContext has actions, render them instead of GlobalSearch
**Test**: Set NavContext actions → render TopNav → verify custom actions render, GlobalSearch does not

### Task 3.6: GREEN - Implement custom actions slot in TopNav

### Task 3.7: REFACTOR - Clean up TopNav conditional rendering logic

---

## Phase 4: Dashboard Integration

### Task 4.1: RED - Test dashboard page does NOT render the old page header
**Behavior**: The old "Dashboard" title with Building icon should not appear
**Test**: Render dashboard → verify no element with text "Overview of all active projects"
**File**: `americancheese/client/src/__tests__/DashboardNav.test.tsx`

### Task 4.2: GREEN - Remove dashboard page header from index.tsx
**What**: Delete the header block (lines ~1015-1099) containing:
- Building icon + "Dashboard" title + subtitle
- Desktop metrics pills (lg:flex)
- Search input, filter dropdown, New Project button
- Mobile metrics bar

### Task 4.3: RED - Test dashboard sets NavContext with correct pill data
**Behavior**: Dashboard should set 5 pills in NavContext with live counts from API data
**Test**: Mock API responses → render dashboard → verify NavContext receives pills with correct counts
**Expected pills**: Projects (count from projects.length), Tasks (open tasks), Events (upcoming), Materials (pending), Contacts (total)

### Task 4.4: GREEN - Dashboard sets NavContext pills
**What**: Use `useEffect` + `setPills` to inject pill data from existing query hooks
**Data sources** (already fetched in dashboard):
- Projects: `projects.length`
- Tasks: `tasks.filter(t => !t.completed).length`
- Events: tasks with upcoming dates (derive from existing tasks query)
- Materials: `materials.filter(m => m.status === "ordered").length`
- Contacts: `contacts.length`

### Task 4.5: RED - Test dashboard sets NavContext with search/filter/action
**Behavior**: Dashboard should inject its search input, status filter, and New Project button into NavContext
**Test**: Render dashboard → verify NavContext actions contain search, filter, and button elements

### Task 4.6: GREEN - Dashboard sets NavContext actions
**What**: Move search input, status filter Select, and New Project Button into NavContext actions
**Keep**: All existing state (searchQuery, statusFilter, handleCreateProject) stays in dashboard component

---

## Phase 5: Layout Integration

### Task 5.1: RED - Test Layout wraps children with NavProvider
**Behavior**: NavProvider should wrap the page content so both TopNav and page can share context
**Test**: Render Layout → verify NavProvider is in the tree
**File**: `americancheese/client/src/__tests__/Layout.test.tsx`

### Task 5.2: GREEN - Add NavProvider to Layout component
**What**: Wrap Layout's content (including TopNav + main) in `<NavProvider>`

### Task 5.3: REFACTOR - Final cleanup
- Remove unused imports from dashboard/index.tsx (Building icon if no longer used, etc.)
- Verify TypeScript passes (`npm run check`)
- Verify dev server runs without errors

---

## File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Modify | Add @testing-library/react, @testing-library/jest-dom, jsdom |
| `vitest.config.ts` | Modify | Add client test project with jsdom environment |
| `client/src/test/setup.ts` | Create | Testing library setup |
| `client/src/contexts/NavContext.tsx` | Create | React context for page-to-nav communication |
| `client/src/components/layout/NavPill.tsx` | Create | Clickable stats pill component |
| `client/src/components/layout/TopNav.tsx` | Modify | Conditional pills vs tabs, custom actions vs GlobalSearch |
| `client/src/components/layout/Layout.tsx` | Modify | Wrap with NavProvider |
| `client/src/pages/dashboard/index.tsx` | Modify | Remove page header, set NavContext |
| `client/src/__tests__/NavContext.test.tsx` | Create | Context unit tests |
| `client/src/__tests__/NavPill.test.tsx` | Create | Pill component tests |
| `client/src/__tests__/TopNav.test.tsx` | Create | TopNav conditional rendering tests |
| `client/src/__tests__/DashboardNav.test.tsx` | Create | Dashboard integration tests |
| `client/src/__tests__/Layout.test.tsx` | Create | Layout provider test |

## Dependencies

```
Phase 0 (infra) → Phase 1 (context) → Phase 2 (pill) → Phase 3 (TopNav) → Phase 4 (dashboard) → Phase 5 (layout + cleanup)
```

Each phase depends on the previous. Within a phase, tasks are sequential (RED → GREEN → REFACTOR).

## Acceptance Criteria

1. On dashboard (desktop): TopNav shows 5 stats pills instead of tab buttons
2. Each pill displays live count + section label and navigates on click
3. Active pill (dashboard/projects) has distinct highlighted styling
4. Search, filter, New Project button appear in TopNav right zone
5. The old page header row is completely removed
6. On non-dashboard pages: TopNav renders exactly as before (standard tabs)
7. Mobile navigation is completely unchanged
8. All tests pass
9. TypeScript compiles without errors

## Last Updated
2026-02-12 by /oss:plan
