-- SQL Schema for Angren IMI Telegram News Integration
-- Execute this in your Cloudflare D1 Console or via Wrangler:
-- wrangler d1 execute angren-im --file=./schema.sql

CREATE TABLE IF NOT EXISTS company_news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_post_id INTEGER UNIQUE,
  title TEXT,
  body TEXT,
  image_url TEXT,
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TEXT
);

-- Index for faster sorting by latest Telegram posts
CREATE INDEX IF NOT EXISTS idx_tg_post_id ON company_news (tg_post_id DESC);
