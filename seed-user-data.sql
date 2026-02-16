-- Seed data for egorkabantsov@gmail.com
-- This will give the user everything unlocked (100+ day streak)

-- First, get the user ID
-- You'll need to replace 'USER_ID_HERE' with the actual UUID from auth.users table

-- For now, I'll use a placeholder. Run this query first to get the user ID:
-- SELECT id FROM auth.users WHERE email = 'egorkabantsov@gmail.com';

-- Then replace USER_ID_HERE below with the actual UUID

-- Delete existing posts for this user (optional, comment out if you want to keep existing data)
-- DELETE FROM posts WHERE user_id = 'USER_ID_HERE';

-- Insert 120 days worth of journal entries (to unlock everything)
-- This creates entries going back 120 days from today

DO $$
DECLARE
    user_uuid UUID := 'f325436a-84ef-4c70-830d-d0f8d92239d4'; -- REPLACE THIS WITH ACTUAL USER ID
    entry_date TIMESTAMP;
    day_offset INT;
BEGIN
    FOR day_offset IN 0..119 LOOP
        entry_date := NOW() - (day_offset || ' days')::INTERVAL;
        
        INSERT INTO posts (user_id, text, created_at, updated_at, is_favorite)
        VALUES (
            user_uuid,
            CASE (day_offset % 10)
                WHEN 0 THEN 'Today was amazing! I felt so grateful for my family and friends. The weather was beautiful and I spent time outdoors enjoying nature.'
                WHEN 1 THEN 'Had a productive day at work. Feeling accomplished and motivated to keep going. Made great progress on my goals.'
                WHEN 2 THEN 'Spent quality time with loved ones today. Feeling blessed and happy. These moments are what life is all about.'
                WHEN 3 THEN 'Worked on my personal goals today. Making progress feels great! Every small step counts towards the bigger picture.'
                WHEN 4 THEN 'Feeling grateful for all the opportunities in my life. Today was peaceful and calm. I appreciate the simple things.'
                WHEN 5 THEN 'Had some challenges today but overcame them. Feeling strong and resilient. Growth comes from facing difficulties.'
                WHEN 6 THEN 'Enjoyed a beautiful morning. Grateful for the simple things in life. The sunrise was absolutely breathtaking.'
                WHEN 7 THEN 'Feeling motivated and inspired. Ready to tackle new challenges! The future looks bright and full of possibilities.'
                WHEN 8 THEN 'Spent time on self-care today. Feeling refreshed and energized. Taking care of myself helps me take care of others.'
                ELSE 'Had a wonderful day filled with gratitude and joy. Life is beautiful and I am thankful for every moment.'
            END,
            entry_date,
            entry_date,
            (day_offset % 5 = 0) -- Make every 5th entry a favorite
        );
    END LOOP;
END $$;

-- Verify the data
-- SELECT COUNT(*) as total_entries, 
--        MIN(created_at) as oldest_entry, 
--        MAX(created_at) as newest_entry,
--        COUNT(CASE WHEN is_favorite THEN 1 END) as favorites
-- FROM posts 
-- WHERE user_id = 'USER_ID_HERE';
