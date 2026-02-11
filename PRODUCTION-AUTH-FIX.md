# Production Authentication Fix

## 🚨 Problem

**Symptom:** No tasks or projects showing on live production

**Root Cause:** The `session_tokens` and `api_tokens` database tables are missing from production. These tables are critical for the authentication system but were not included in the database initialization code.

### What happens:
1. User logs in successfully
2. Backend tries to store session token in `session_tokens` table
3. Table doesn't exist, so token storage fails (possibly silently)
4. Subsequent API requests include the token in Authorization header
5. Backend can't validate token (table doesn't exist)
6. All API requests return 401 Unauthorized
7. Frontend shows no data and may redirect to login

## ✅ Solution

The fix has been implemented in **3 parts**:

### 1. Updated Database Schema Import ([db.ts:3-23](americancheese/server/db.ts#L3-L23))
- Added `sessionTokens` and `apiTokens` to the imports from schema.ts
- Added them to the Drizzle ORM schema configuration

### 2. Created Migration ([add-auth-tokens.js](americancheese/server/migrations/add-auth-tokens.js))
- New migration creates both tables if they don't exist
- Includes proper indexes for performance
- Handles users table dependency

### 3. Standalone Fix Script ([fix-production-auth.js](fix-production-auth.js))
- Can be run directly on production without redeploying
- Creates the missing tables
- Safe to run multiple times (checks if tables exist first)

## 🔧 How to Fix Production

### Option A: Run the Standalone Script (Recommended)

**On your production server:**

```bash
cd /path/to/your/app

# Make sure you have the latest code
git pull

# Set your production database credentials in .env
# Ensure these are set:
# DB_HOST=your-host
# DB_PORT=5432
# DB_NAME=your-database
# DB_USER=your-user
# DB_PASSWORD=your-password

# Run the fix script
node fix-production-auth.js
```

Expected output:
```
🔧 Connecting to database...
   Host: your-host:5432
   Database: your-database

✅ Database connection successful

📋 Checking users table...
   ✅ Users table exists

📋 Checking session_tokens table...
   Creating session_tokens table...
   ✅ session_tokens table created with indexes

📋 Checking api_tokens table...
   Creating api_tokens table...
   ✅ api_tokens table created with indexes

🎉 SUCCESS! Authentication tables are now in place.
```

**Then restart your server:**
```bash
# If using PM2
pm2 restart your-app-name

# If using systemd
sudo systemctl restart your-app

# If using Docker
docker-compose restart
```

### Option B: Use Drizzle Kit (Alternative)

If you prefer to use Drizzle Kit for migrations:

```bash
cd americancheese

# Generate migration
npm run db:generate

# Push to production database
npm run db:push
```

### Option C: Manual SQL (If needed)

If you need to run the SQL manually:

```sql
-- Create session_tokens table
CREATE TABLE IF NOT EXISTS session_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_session_tokens_token ON session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_session_tokens_user_id ON session_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tokens_expires_at ON session_tokens(expires_at);

-- Create api_tokens table
CREATE TABLE IF NOT EXISTS api_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  token_prefix TEXT NOT NULL,
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_token ON api_tokens(token);
CREATE INDEX IF NOT EXISTS idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_is_active ON api_tokens(is_active);
```

## 🧪 Verify the Fix

After running the fix and restarting:

1. **Check tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('session_tokens', 'api_tokens');
   ```
   Should return both table names.

2. **Try logging in:**
   - Go to your production site
   - Log in with your credentials
   - Check that you stay logged in after page refresh
   - Verify projects and tasks are now visible

3. **Check session_tokens table has data:**
   ```sql
   SELECT COUNT(*) FROM session_tokens;
   ```
   Should show at least 1 row after you log in.

## 📝 Why This Happened

The authentication system was refactored to use database-backed session tokens (instead of just in-memory sessions). The schema definition was added to `shared/schema.ts`, but:

1. The tables weren't imported in `server/db.ts`
2. They weren't added to the Drizzle schema configuration
3. No migration was created to add them to existing databases

This meant:
- New deployments would have the tables if `db:push` was run
- But existing production databases were missing them
- The auth system silently failed when it couldn't store tokens

## 🔒 Security Note

The authentication system uses:
- **Session tokens:** Short-lived (24 hours), stored hashed in database
- **API tokens:** Long-lived, for MCP server and API access
- **Secure cookies:** HttpOnly, SameSite=Lax, with optional domain config
- **bcrypt password hashing:** 10 rounds for user passwords

All working properly now that the tables exist!

## 📚 Related Files

### Modified:
- `americancheese/server/db.ts` - Added imports and migration call
- `americancheese/server/migrations/add-auth-tokens.js` - New migration

### Created:
- `fix-production-auth.js` - Standalone fix script
- `PRODUCTION-AUTH-FIX.md` - This guide

### Related:
- `americancheese/shared/schema.ts:68-76` - session_tokens table definition
- `americancheese/shared/schema.ts:44-66` - api_tokens table definition
- `americancheese/server/auth.ts:239-254` - Token validation code
- `americancheese/client/src/lib/queryClient.ts:16-24` - Client auth token usage
