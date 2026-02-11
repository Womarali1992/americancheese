# Deployment Guide - American Cheese

## ✅ Pre-Deployment Checklist

Before deploying to production, ensure:

1. **All migrations are complete** - Check that migration files match the schema
2. **Local testing passes** - Run `npm run dev` and verify all features work
3. **TypeScript compiles** - Run `npm run check` with no errors
4. **Git is up to date** - All changes committed and pushed to `main` branch

## 🚀 Standard Deployment Process

### Step 1: Deploy Code to Production
```bash
ssh root@134.199.207.43
cd /var/www/americancheese
git pull origin main
```

### Step 2: Install Dependencies (if package.json changed)
```bash
npm install
```

### Step 3: Build (if client/server code changed)
```bash
NODE_OPTIONS='--max-old-space-size=2048' npm run build
```

### Step 4: Restart Application
```bash
pm2 restart americancheese
```

### Step 5: Verify Deployment
```bash
# Check PM2 status
pm2 status

# Monitor logs for errors
pm2 logs americancheese --lines 50

# Check error log for issues
tail -50 /var/log/americancheese/error-0.log
```

### Step 6: Test in Browser
- Visit https://app.sitesetups.com/dashboard
- Verify projects, categories, tasks, materials, and labor all load
- Check browser console for errors

## 🔧 Migration System

### How Migrations Work

The app automatically runs migrations on server startup via `initDatabase()` in [server/db.ts](americancheese/server/db.ts).

**Migration files location:** `americancheese/server/migrations/`

**Current migrations (run in order):**
1. `add-auth-tokens.js` - Authentication tables (CRITICAL - must run first)
2. `add-selected-templates.js` - Project template selection
3. `add-task-time-fields.js` - Task time tracking
4. `add-calendar-schedule-fields.js` - Calendar integration
5. `add-referenced-task-ids.js` - Task references
6. `add-project-members.js` - Project membership
7. `add-contacts-created-by.js` - Contact ownership
8. `add-category-context.js` - Category AI context
9. `add-recurring-calendar-fields.js` - Recurring tasks & calendar fields

### Adding New Migrations

When adding new schema fields in `shared/schema.ts`:

1. **Create migration file** in `americancheese/server/migrations/`
2. **Follow the pattern** - Check if column exists before adding:
   ```javascript
   export async function addMyNewField(queryClient) {
     const check = await queryClient.query(`
       SELECT column_name
       FROM information_schema.columns
       WHERE table_name = 'my_table' AND column_name = 'my_column'
     `);

     if (check.rows.length === 0) {
       await queryClient.query(`
         ALTER TABLE my_table ADD COLUMN my_column TEXT
       `);
       console.log('my_column added to my_table');
     }
   }
   ```
3. **Import in db.ts** - Add import at top of file
4. **Call in initDatabase()** - Add to migration list (order matters!)
5. **Test locally** - Verify migration runs without errors
6. **Commit and deploy** - Migration will run automatically on production restart

## 🐛 Troubleshooting Common Issues

### Tasks/Materials/Labor Not Loading (500 Errors)

**Symptoms:** Browser console shows "500 Internal Server Error" for API calls

**Diagnosis:**
```bash
# Check error logs
ssh root@134.199.207.43
tail -100 /var/log/americancheese/error-0.log | grep "column.*does not exist"
```

**Fix:** Missing database column - add via migration or manual SQL:
```bash
# Connect to database
sudo -u postgres psql -d americancheese

# Add missing column (example)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS missing_column_name TYPE;

# Exit psql
\q

# Restart application
pm2 restart americancheese
```

### Build Fails with "JavaScript heap out of memory"

**Fix:** Increase Node.js memory allocation:
```bash
NODE_OPTIONS='--max-old-space-size=2048' npm run build
```

### Authentication Not Working

**Fix:** Ensure `add-auth-tokens` migration ran:
```bash
# Check if tables exist
sudo -u postgres psql -d americancheese -c "\dt" | grep -E "session_tokens|api_tokens"

# If missing, run migration manually
cd /var/www/americancheese && node -e "
  import('./americancheese/server/migrations/add-auth-tokens.js')
    .then(m => m.addAuthTokensTables(pool))
"
```

### Categories Not Showing

**Fix:** Initialize project categories:
```bash
cd /var/www/americancheese
node initialize-project-categories.js
```

## 📊 Database Management

### Check Database Connection
```bash
sudo -u postgres psql -l  # List databases
sudo -u postgres psql -d americancheese  # Connect to database
```

### Common Database Commands
```sql
-- List tables
\dt

-- Describe table structure
\d tasks

-- Check column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY column_name;

-- Count records
SELECT COUNT(*) FROM tasks;
```

### Verify Migration Columns

Run this to verify all recurring fields exist:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tasks'
  AND column_name IN (
    'is_recurring',
    'recurrence_pattern',
    'recurrence_interval',
    'recurrence_end_date',
    'parent_recurring_task_id'
  )
ORDER BY column_name;
```

Should return 5 rows.

## 🔐 Environment Variables

Production environment variables are set in PM2 ecosystem config or system environment.

**Required variables:**
- `DB_HOST` - Database host (usually localhost)
- `DB_PORT` - Database port (usually 5432)
- `DB_NAME` - Database name (americancheese)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `PORT` - Application port (5001)
- `NODE_ENV` - Should be "production"

**Check current env:**
```bash
pm2 env 0  # Show environment for process 0
```

## 📝 Quick Reference

| Task | Command |
|------|---------|
| Deploy | `git pull && npm run build && pm2 restart americancheese` |
| Check logs | `pm2 logs americancheese` |
| Check errors | `tail -f /var/log/americancheese/error-0.log` |
| Restart app | `pm2 restart americancheese` |
| DB console | `sudo -u postgres psql -d americancheese` |
| Check PM2 status | `pm2 status` |

## 🆘 Emergency Rollback

If deployment breaks production:

```bash
# 1. Rollback git
git log --oneline -5  # Find last good commit
git reset --hard <commit-hash>

# 2. Rebuild
NODE_OPTIONS='--max-old-space-size=2048' npm run build

# 3. Restart
pm2 restart americancheese

# 4. Verify
pm2 logs americancheese --lines 50
```

---

**Last Updated:** 2026-02-11
**Production Server:** 134.199.207.43
**Production URL:** https://app.sitesetups.com
