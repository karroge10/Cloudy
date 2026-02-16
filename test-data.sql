-- Delete all posts for testing
DELETE FROM posts;

-- Insert test data with plain text (no encryption) for the current month
-- Replace 'YOUR_USER_ID' with your actual user ID

-- Get current month's dates
INSERT INTO posts (user_id, text, created_at, updated_at) VALUES
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Today was amazing! I felt so grateful for my family and friends. The weather was beautiful and I spent time outdoors.', '2026-02-01 10:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Had a productive day at work. Feeling accomplished and motivated to keep going.', '2026-02-02 14:30:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Spent quality time with loved ones today. Feeling blessed and happy.', '2026-02-03 18:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Worked on my personal goals today. Making progress feels great!', '2026-02-04 09:15:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Feeling grateful for all the opportunities in my life. Today was peaceful and calm.', '2026-02-05 16:45:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Had some challenges today but overcame them. Feeling strong and resilient.', '2026-02-06 11:20:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Enjoyed a beautiful morning. Grateful for the simple things in life.', '2026-02-07 08:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Feeling motivated and inspired. Ready to tackle new challenges!', '2026-02-08 13:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Spent time on self-care today. Feeling refreshed and energized.', '2026-02-09 17:30:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Had a wonderful conversation with a friend. Feeling connected and happy.', '2026-02-10 12:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Today I focused on gratitude and mindfulness. Feeling peaceful.', '2026-02-11 15:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Made progress on my goals today. Feeling accomplished and proud.', '2026-02-12 10:30:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Enjoyed quality time with family. Feeling loved and grateful.', '2026-02-13 19:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Had a creative day today. Feeling inspired and motivated.', '2026-02-14 14:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Feeling grateful for my health and happiness. Today was wonderful.', '2026-02-15 11:00:00+00', NOW()),
('f325436a-84ef-4c70-830d-d0f8d92239d4', 'Spent time reflecting on my journey. Feeling proud of how far I have come.', '2026-02-16 16:00:00+00', NOW());
