CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password TEXT,
  name TEXT,
  role TEXT,
  bio TEXT,
  skills TEXT,
  winnings TEXT,
  learnings TEXT,
  github TEXT,
  linkedin TEXT,
  avatar TEXT,
  public_key TEXT,
  hack_score INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  description TEXT,
  link TEXT,
  tags TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY,
  sender_id UUID REFERENCES users(id),
  receiver_id UUID REFERENCES users(id),
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS team_signals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  message TEXT,
  role_needed TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY,
  creator_id UUID REFERENCES users(id),
  title TEXT,
  pitch TEXT,
  roles_needed TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hackathons (
  id UUID PRIMARY KEY,
  name TEXT,
  date TEXT,
  prize_pool TEXT,
  tech_stack_focus TEXT,
  team_size TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_hackathons (
  user_id UUID REFERENCES users(id),
  hackathon_id UUID REFERENCES hackathons(id),
  PRIMARY KEY (user_id, hackathon_id)
);

CREATE TABLE IF NOT EXISTS stack_clashes (
  id UUID PRIMARY KEY,
  connection_id UUID REFERENCES connections(id),
  user_id UUID REFERENCES users(id),
  code TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reputation (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  score_component TEXT,
  points INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debriefs (
  id UUID PRIMARY KEY,
  hackathon_id UUID REFERENCES hackathons(id),
  user_id UUID REFERENCES users(id),
  project_link TEXT,
  hardest_challenge TEXT,
  do_differently TEXT,
  teammate_rating INTEGER,
  teammate_tags TEXT,
  hack_again TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
