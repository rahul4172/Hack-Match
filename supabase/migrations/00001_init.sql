-- HackMatch full schema for Supabase PostgreSQL
-- Run via Supabase SQL Editor or: supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  role TEXT,
  bio TEXT,
  skills TEXT DEFAULT '[]',
  winnings TEXT,
  learnings TEXT,
  github TEXT,
  linkedin TEXT,
  avatar TEXT,
  public_key TEXT,
  hack_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  link TEXT,
  tags TEXT DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  role_needed TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  creator_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  pitch TEXT,
  roles_needed TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hackathons (
  id TEXT PRIMARY KEY,
  name TEXT,
  date TEXT,
  prize_pool TEXT,
  tech_stack_focus TEXT,
  team_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_hackathons (
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  hackathon_id TEXT REFERENCES hackathons(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, hackathon_id)
);

CREATE TABLE IF NOT EXISTS stack_clashes (
  id TEXT PRIMARY KEY,
  connection_id TEXT REFERENCES connections(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT,
  code TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reputation (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  score_component TEXT,
  points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debriefs (
  id TEXT PRIMARY KEY,
  hackathon_id TEXT REFERENCES hackathons(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  project_link TEXT,
  hardest_challenge TEXT,
  do_differently TEXT,
  teammate_rating INTEGER,
  teammate_tags TEXT,
  hack_again TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connections_sender ON connections(sender_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_team_signals_expires ON team_signals(expires_at);
