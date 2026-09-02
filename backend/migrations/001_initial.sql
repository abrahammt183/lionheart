-- Add Sports category and subcategories
INSERT OR IGNORE INTO categories (name, slug, description, parent_id)
VALUES ('Sports', 'sports', 'Athletics, competition, and physical activity', NULL);

INSERT OR IGNORE INTO categories (name, slug, description, parent_id)
VALUES
  ('Bodybuilding', 'bodybuilding', 'Strength training, muscle building, and fitness',
   (SELECT id FROM categories WHERE slug = 'sports')),
  ('Backgammon', 'backgammon', 'The classic board game of strategy and chance',
   (SELECT id FROM categories WHERE slug = 'sports'));
