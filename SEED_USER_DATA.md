# Seeding Data for egorkabantsov@gmail.com

## Step 1: Get the User ID

Run this query in Supabase SQL Editor:

```sql
SELECT id FROM auth.users WHERE email = 'egorkabantsov@gmail.com';
```

Copy the UUID that's returned.

## Step 2: Run the Seed Script

Open `seed-user-data.sql` and replace `USER_ID_HERE` with the UUID from Step 1.

Then run the entire script in the Supabase SQL Editor.

## What This Does

- Creates **120 journal entries** going back 120 days
- Ensures the user has a **100+ day streak** (unlocks all achievements)
- Marks every 5th entry as a **favorite**
- Uses varied text content to generate meaningful insights

## Alternative: Quick Manual Seed

If you want to do it manually without the script, here's a simpler version:

```sql
-- Replace YOUR_USER_ID with the actual UUID
INSERT INTO posts (user_id, text, created_at, updated_at)
SELECT 
    'YOUR_USER_ID'::UUID,
    'Today was amazing! I felt grateful for everything in my life. ' || generate_series || ' days ago.',
    NOW() - (generate_series || ' days')::INTERVAL,
    NOW() - (generate_series || ' days')::INTERVAL
FROM generate_series(0, 119);
```

This creates 120 entries with simple text going back 120 days.

## Verify the Data

After running, verify with:

```sql
SELECT 
    COUNT(*) as total_entries,
    MIN(created_at) as oldest_entry,
    MAX(created_at) as newest_entry
FROM posts 
WHERE user_id = 'YOUR_USER_ID';
```

You should see 120 entries spanning 120 days.
