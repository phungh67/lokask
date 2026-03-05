-- Clean up old data to prevent duplicates
TRUNCATE TABLE reviews, portfolio_items, consultant_niches, consultants, niches, cities, users RESTART IDENTITY CASCADE;

-- =======================================================
-- 1. LOCATIONS (Adding Global Cities)
-- =======================================================
INSERT INTO cities (name, country_code, region) VALUES
('Ho Chi Minh City', 'VN', 'Southeast'), -- ID 1
('Kyoto', 'JP', 'Kansai'),             -- ID 2
('Da Nang', 'VN', 'Central'),          -- ID 3
('Tokyo', 'JP', 'Kanto'),              -- ID 4
('Seoul', 'KR', 'Gyeonggi'),           -- ID 5
('Bangkok', 'TH', 'Central'),          -- ID 6
('Paris', 'FR', 'Île-de-France'),      -- ID 7
('Rome', 'IT', 'Lazio'),               -- ID 8
('Barcelona', 'ES', 'Catalonia'),      -- ID 9
('London', 'GB', 'England'),           -- ID 10
('New York', 'US', 'New York');        -- ID 11

-- =======================================================
-- 2. NICHES
-- =======================================================
INSERT INTO niches (slug, display_name) VALUES
('foodie', 'Street Food Expert'),      -- ID 1
('history', 'History Buff'),           -- ID 2
('nightlife', 'Nightlife Guide'),      -- ID 3
('adventure', 'Adventure Seeker'),     -- ID 4
('art', 'Art & Museums'),              -- ID 5
('shopping', 'Shopping & Fashion'),    -- ID 6
('anime', 'Anime & Otaku Culture');    -- ID 7

-- =======================================================
-- 3. USERS (Identities)
-- =======================================================

-- ORIGINAL (Keep these for your specific tests)
INSERT INTO users (id, email, password_hash, full_name, avatar_url) VALUES
('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 'guide@asklocal.com', 'hashed', 'Nguyen Van A', 'https://i.pravatar.cc/150?u=guide'),
('c3eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', 'traveler@gmail.com', 'hashed', 'John Doe', 'https://i.pravatar.cc/150?u=traveler');

-- NEW CONSULTANT IDENTITIES
INSERT INTO users (email, password_hash, full_name, avatar_url) VALUES
('kenji@tokyo.com', 'hashed', 'Kenji Tanaka', 'https://i.pravatar.cc/150?u=kenji'),
('marie@paris.com', 'hashed', 'Marie Dubois', 'https://i.pravatar.cc/150?u=marie'),
('alessandro@rome.com', 'hashed', 'Alessandro Rossi', 'https://i.pravatar.cc/150?u=alessandro'),
('jimin@seoul.com', 'hashed', 'Park Ji-Min', 'https://i.pravatar.cc/150?u=jimin'),
('somchai@bkk.com', 'hashed', 'Somchai S.', 'https://i.pravatar.cc/150?u=somchai'),
('elena@bcn.com', 'hashed', 'Elena Gomez', 'https://i.pravatar.cc/150?u=elena'),
('james@london.com', 'hashed', 'James Wright', 'https://i.pravatar.cc/150?u=james'),
('sarah@nyc.com', 'hashed', 'Sarah Jenkins', 'https://i.pravatar.cc/150?u=sarah'),
('sakura@kyoto.com', 'hashed', 'Sakura Sato', 'https://i.pravatar.cc/150?u=sakura'),
('luca@rome.com', 'hashed', 'Luca Bianchi', 'https://i.pravatar.cc/150?u=luca');

-- =======================================================
-- 4. CONSULTANT PROFILES
-- =======================================================

-- ORIGINAL (Hardcoded UUID for Profile Screen Test)
INSERT INTO consultants (id, user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'b2eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', 1, 'I know the best hidden phở spots in District 3. Let me show you the real Saigon.', 25.00, 4.8, 12, TRUE);

-- NEW CONSULTANTS (Using subqueries to find user_ids dynamically)

-- Kenji (Tokyo - Anime/Tech)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 4, 'Otaku guide! I will take you to Akihabara hidden shops and the best maid cafes.', 40.00, 4.9, 85, TRUE
FROM users WHERE email = 'kenji@tokyo.com';

-- Marie (Paris - Art/Wine)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 7, 'Art historian and wine lover. Skip the Louvre queues and discover Montmartre with me.', 60.00, 4.7, 42, TRUE
FROM users WHERE email = 'marie@paris.com';

-- Alessandro (Rome - History)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 8, 'Walking encyclopaedia of Roman history. I make ruins come alive.', 55.00, 5.0, 120, TRUE
FROM users WHERE email = 'alessandro@rome.com';

-- Ji-Min (Seoul - Shopping/Fashion)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 5, 'Personal shopper for K-Fashion and skincare in Myeongdong.', 35.00, 4.6, 20, FALSE
FROM users WHERE email = 'jimin@seoul.com';

-- Somchai (Bangkok - Food/Nightlife)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 6, 'Forget Pad Thai. I will show you spicy Isan food and the best rooftop bars.', 20.00, 4.5, 55, TRUE
FROM users WHERE email = 'somchai@bkk.com';

-- Elena (Barcelona - Architecture)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 9, 'Gaudí is great, but wait until you see the hidden Gothic Quarter gems.', 45.00, 4.8, 30, TRUE
FROM users WHERE email = 'elena@bcn.com';

-- James (London - History/Pubs)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 10, 'A pint in a 300-year-old pub? Let''s go. I know the best ale in London.', 50.00, 4.4, 15, FALSE
FROM users WHERE email = 'james@london.com';

-- Sarah (NYC - Pizza/Nightlife)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 11, 'Brooklyn pizza tour guide. I know which slice is actually worth the hype.', 70.00, 4.9, 200, TRUE
FROM users WHERE email = 'sarah@nyc.com';

-- Sakura (Kyoto - Tradition)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 2, 'Tea ceremony expert. Experience the quiet side of Kyoto temples.', 45.00, 5.0, 10, TRUE
FROM users WHERE email = 'sakura@kyoto.com';

-- Luca (Rome - Food)
INSERT INTO consultants (user_id, city_id, bio, hourly_rate, rating_avg, review_count, is_verified)
SELECT id, 8, 'Carbonara connoisseur. I take you to places without English menus.', 50.00, 4.7, 25, TRUE
FROM users WHERE email = 'luca@rome.com';

-- =======================================================
-- 5. LINK NICHES (Using subqueries for robustness)
-- =======================================================
-- Link Kenji to Anime(7) and Adventure(4)
INSERT INTO consultant_niches (consultant_id, niche_id)
SELECT c.id, n.id FROM consultants c, niches n 
WHERE c.user_id = (SELECT id FROM users WHERE email='kenji@tokyo.com') AND n.slug IN ('anime', 'adventure');

-- Link Marie to Art(5) and Foodie(1)
INSERT INTO consultant_niches (consultant_id, niche_id)
SELECT c.id, n.id FROM consultants c, niches n 
WHERE c.user_id = (SELECT id FROM users WHERE email='marie@paris.com') AND n.slug IN ('art', 'foodie');

-- Link Alessandro to History(2)
INSERT INTO consultant_niches (consultant_id, niche_id)
SELECT c.id, n.id FROM consultants c, niches n 
WHERE c.user_id = (SELECT id FROM users WHERE email='alessandro@rome.com') AND n.slug IN ('history');

-- Link Somchai to Foodie(1) and Nightlife(3)
INSERT INTO consultant_niches (consultant_id, niche_id)
SELECT c.id, n.id FROM consultants c, niches n 
WHERE c.user_id = (SELECT id FROM users WHERE email='somchai@bkk.com') AND n.slug IN ('foodie', 'nightlife');

-- Link Sarah to Nightlife(3) and Foodie(1)
INSERT INTO consultant_niches (consultant_id, niche_id)
SELECT c.id, n.id FROM consultants c, niches n 
WHERE c.user_id = (SELECT id FROM users WHERE email='sarah@nyc.com') AND n.slug IN ('nightlife', 'foodie');

-- =======================================================
-- 6. PORTFOLIO IMAGES
-- =======================================================
-- Kenji (Tokyo)
INSERT INTO portfolio_items (consultant_id, image_url)
SELECT c.id, 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80'
FROM consultants c WHERE c.user_id = (SELECT id FROM users WHERE email='kenji@tokyo.com');

-- Marie (Paris)
INSERT INTO portfolio_items (consultant_id, image_url)
SELECT c.id, 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80'
FROM consultants c WHERE c.user_id = (SELECT id FROM users WHERE email='marie@paris.com');

-- Alessandro (Rome)
INSERT INTO portfolio_items (consultant_id, image_url)
SELECT c.id, 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=800&q=80'
FROM consultants c WHERE c.user_id = (SELECT id FROM users WHERE email='alessandro@rome.com');

-- Somchai (Bangkok)
INSERT INTO portfolio_items (consultant_id, image_url)
SELECT c.id, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80'
FROM consultants c WHERE c.user_id = (SELECT id FROM users WHERE email='somchai@bkk.com');


-- hash_dummy_password