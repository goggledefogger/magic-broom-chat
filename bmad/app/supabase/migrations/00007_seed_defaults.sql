-- Seed default channels (system channels, no creator)
INSERT INTO channels (name, description, type)
VALUES
  ('general', 'General discussion for the class', 'standard'),
  ('resources', 'Share useful links, tools, and learning resources', 'gallery'),
  ('project-showcase', 'Show off your projects and get feedback', 'gallery');
