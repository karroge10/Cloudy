-- Comprehensive Seed data for organic-looking Profile Activity
-- Generates:
-- 1. Current Streak: 6 days (Today to 5 days ago)
-- 2. Max Streak: 30 days (Historical block)
-- 3. Realistic History: Scattered posts across Dec, Jan, Feb
-- 4. Varied density: Christmas break, missing days, multiple posts per day
-- 5. Meaningful entries for screenshots

DO $$
DECLARE
    user_uuid UUID := '7d8d8203-5964-4a0b-8b0b-7fc03ebb04aa'; 
    entry_date TIMESTAMP;
    day_offset INT;
    posts_today INT;
    p INT;
    entry_text TEXT;
    is_fav BOOLEAN;
    
    -- Pick from a pool of realistic entries
    content_pool TEXT[] := ARRAY[
        'Finally finished that book I started weeks ago. Highly recommend.',
        'Caught a beautiful sunset while walking the dog today.',
        'Had a productive deep work session this morning. Feeling ahead.',
        'Tried that new coffee shop downtown. Their espresso is excellent.',
        'Thinking about the goals I set for this month. Slow progress is still progress.',
        'A bit of a rainy day today, perfect for some indoor reflection.',
        'Cooking a new recipe tonight. Hope it tastes as good as it looks.',
        'Met up with an old colleague. Great to see how they are doing.',
        'Early morning yoga really changed my energy level for the whole day.',
        'Just finished a challenging workout. My muscles are screaming but it feels good.',
        'Spending some quiet time listening to a new jazz album.',
        'The neighborhood feels so peaceful this evening.',
        'Reflecting on the meeting today. I think I finally got my point across.',
        'Bought some fresh flowers for the living room. It really brightens the space.',
        'Managed to get through my entire to-do list. Rare win!',
        'A long walk by the river was exactly what I needed to clear my head.',
        'Sunday brunch with the family. Always good for the soul.',
        'Started learning a new skill today. The first steps are always the hardest.',
        'Feeling grateful for the simple things—good coffee and a quiet morning.',
        'Had a long conversation with a friend from abroad. Tech is amazing sometimes.'
    ];
BEGIN
    -- 1. Cleanup
    DELETE FROM posts WHERE user_id = user_uuid;

    -- 2. Generate history going back 100 days
    FOR day_offset IN 0..100 LOOP
        entry_date := NOW() - (day_offset || ' days')::INTERVAL;
        
        -- Default: no posts today
        posts_today := 0;

        -- LOGIC FOR DENSITY/GAPS:
        
        -- A. Current Streak (Days 0-5): Always 1 post
        IF day_offset <= 5 THEN
            posts_today := 1;
            
        -- B. Break the streak: No post on Day 6
        ELSIF day_offset = 6 THEN
            posts_today := 0;
            
        -- C. Scattered February (Days 7-14)
        ELSIF day_offset BETWEEN 7 AND 14 THEN
            IF day_offset = 10 THEN posts_today := 2; -- Multiple posts
            ELSIF day_offset % 3 = 0 THEN posts_today := 0; -- Some gaps
            ELSE posts_today := 1;
            END IF;

        -- D. Historical Max Streak (Days 35-64): 30 days solid
        ELSIF day_offset BETWEEN 35 AND 64 THEN
            posts_today := 1;
            IF day_offset % 10 = 0 THEN posts_today := 2; END IF; -- Extra density

        -- E. Holiday Gap (Christmas Period: approx. Dec 24-26 is day_offset 53-55 approx)
        -- Let's be precise: Today is Feb 17. Dec 25 is 54 days ago.
        ELSIF day_offset BETWEEN 53 AND 56 THEN
            posts_today := 0; -- Total break for Christmas

        -- F. January/Late Dec scattered
        ELSE
            IF day_offset % 7 = 0 THEN posts_today := 0; -- Sunday gaps
            ELSIF (day_offset + 3) % 5 = 0 THEN posts_today := 2; -- Higher activity mid-week
            ELSIF day_offset % 2 = 0 THEN posts_today := 1;
            ELSE posts_today := 0;
            END IF;
        END IF;

        -- 3. Insert the posts
        IF posts_today > 0 THEN
            FOR p IN 1..posts_today LOOP
                -- Pick content
                IF day_offset = 0 THEN
                    entry_text := 'Finally started that new book today. The first chapter is already pulling me in.';
                ELSIF day_offset = 3 THEN -- Valentine's Day (Feb 14)
                    entry_text := 'Had a wonderful Valentine''s Day dinner with my lovely partner. The dessert was incredible.';
                ELSIF day_offset = 28 THEN -- UI Test (Long text)
                    entry_text := 'Today I spent a lot of time reflecting on the goals I set for this year. It''s already the middle of January and while I''ve made some progress, there''s still so much more I want to achieve. I need to stay focused and keep pushing through the cold winter days. The morning coffee was especially good today, which helped keep the momentum going through the long afternoon meetings.';
                ELSE
                    -- Random from pool
                    entry_text := content_pool[1 + ((day_offset * 3 + p) % 20)];
                END IF;

                is_fav := (day_offset % 12 = 0 OR (day_offset = 3 AND p = 1));

                -- Shift entry date slightly for multiple posts on same day
                INSERT INTO posts (user_id, text, created_at, is_favorite)
                VALUES (user_uuid, entry_text, entry_date - (p || ' hours')::INTERVAL, is_fav);
            END LOOP;
        END IF;
    END LOOP;

    -- 4. Sync Profile Stats
    UPDATE profiles 
    SET max_streak = 30
    WHERE id = user_uuid;
    
    BEGIN
        EXECUTE 'UPDATE profiles SET streak_count = 6 WHERE id = $1' USING user_uuid;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

END $$;
