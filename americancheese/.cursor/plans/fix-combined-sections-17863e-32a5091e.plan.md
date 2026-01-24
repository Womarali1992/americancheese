<!-- 32a5091e-affa-4b71-a978-87c693c96db8 bec91054-f2ae-4796-b85e-0ab5828a946b -->
# Fix Combined Sections Persistence - Root Cause Found

## Problem

When sections are combined in subtasks, they appear combined initially but revert to the original separate sections after page refresh.

## Root Cause Analysis

The issue is a **circular split-join cycle** in `client/src/components/CommentableDescription.tsx`:

1. When combining sections, they're joined with `\n\n` (double newline):

   - Line 353 in `combineToSection`
   - Line 447 in `combineSections`

2. The combined description is saved to the database
3. On page refresh, the description is split on `\n\n` (lines 271-273)
4. This causes the "combined" sections to split back into separate sections!

**Example:**

```
Section A + Section B → "Section A\n\nSection B" → Save → Reload → Split on \n\n → Back to 2 sections
```

## Solution

Change the join delimiter from double newline (`\n\n`) to single newline (`\n`) when combining sections.

### Changes Required in `client/src/components/CommentableDescription.tsx`:

**1. Line 353 in `combineToSection` function:**

```typescript
// Change from:
const combinedText = sections.slice(startIdx, endIdx + 1).join('\n\n');
// To:
const combinedText = sections.slice(startIdx, endIdx + 1).join('\n');
```

**2. Line 447 in `combineSections` function:**

```typescript
// Change from:
const combinedText = sortedIds.map(id => sections[id]).join('\n\n');
// To:
const combinedText = sortedIds.map(id => sections[id]).join('\n');
```

## Why This Works

The split regex `/\n{2,}|...` only splits on **two or more** newlines. By joining with a single newline, the combined sections remain as one block after the split operation on reload.

## Expected Outcome

- Combined sections will persist as single sections after page refresh
- The section markers will continue to work correctly
- Users will see their combined sections remain combined in the Special Sections panel

### To-dos

- [ ] Update combineSections function to preserve and adjust section markers instead of clearing them
- [ ] Update combineToSection function with the same marker preservation logic
- [ ] Verify that combined sections persist after page refresh