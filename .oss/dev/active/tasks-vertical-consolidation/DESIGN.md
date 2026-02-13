# Design: Tasks Page - Reduce Vertical Space Before Category Cards

## Problem
Too much vertical space between the top of the tasks page and the first category cards. Currently the stack is:
1. Breadcrumb bar (mb-3)
2. Tasks header card (p-3/p-4 padding + folder badges)
3. Project info card (mb-4 + header + body with description)
4. Tab switcher (List View / Timeline View)
5. Category card grid

That's ~5 distinct rows before content appears.

## Solution: Merge breadcrumbs into the header card

Move the breadcrumb navigation (Back button + category badges) into the tasks header card as a second row, eliminating one standalone row. Also tighten spacing.

### Specific Changes

**File**: `americancheese/client/src/pages/tasks/index.tsx`

1. **Remove standalone breadcrumb bar** (lines 1685-1749) - the `flex items-center gap-3 mb-3 px-1` div
2. **Add breadcrumbs as a second row inside the header card** - below the folder badges row, inside the existing `bg-white border border-slate-200 rounded-lg` container, with a subtle `border-t border-slate-100` separator
3. **Tighten project info card spacing** - reduce `mb-4` to `mb-2`, reduce `p-4` body to `p-3`
4. **Remove `ArrowLeft` import** if no longer used anywhere

## Scope
- Single file: `americancheese/client/src/pages/tasks/index.tsx`
- ~3-4 edits (move breadcrumbs, tighten spacing)
- No logic changes
