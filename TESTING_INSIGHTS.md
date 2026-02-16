# MonthlyInsights Testing Instructions

## Step 1: Delete encrypted data and add test data

You can run the SQL script in the Supabase dashboard:

1. Go to: https://supabase.com/dashboard/project/cuzgcihrdvouwreudmyq/sql/new
2. Copy and paste the contents of `test-data.sql`
3. Click "Run" to execute

**OR** use the Supabase CLI:

```bash
# If you have supabase CLI installed
npx supabase db execute --file test-data.sql --db-url "postgresql://postgres.cuzgcihrdvouwreudmyq:Karrogekarrogekarroge1!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

## Step 2: Test the component

After running the SQL, the MonthlyInsights component should now work without encryption errors and display:
- Total entries for the current month
- Total words written
- Average words per entry
- Top 5 most used words (excluding common stop words)

## Changes Made

### MonthlyInsights Component
- **Rebuilt from scratch** to match ProfileScreen aesthetic
- **Removed encryption** - now works with plain text
- **Matches ActivityGraph styling** - same card style with shadow
- **Added skeleton loading** - consistent with other components
- **Three stats display** - Entries, Words, Avg/Entry
- **Top themes** - Shows top 5 words with counts
- **Better error handling** - No navigation context errors

### Styling
- Uses `bg-card rounded-[32px] p-6` like ActivityGraph
- Same shadow: `shadow-[#0000000D] shadow-xl`
- Consistent typography and spacing
- Primary color accents for stats
- Top word gets primary background, others get subtle gray

The component will now render cleanly without any encryption-related errors!
