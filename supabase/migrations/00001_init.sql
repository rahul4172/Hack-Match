-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TYPE role_enum AS ENUM ('frontend', 'backend', 'ml', 'blockchain', 'mobile', 'ux', 'devops', 'pm', 'fullstack');
CREATE TYPE availability_enum AS ENUM ('this_weekend', 'next_2_weeks', 'this_month', 'flexible');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    github_id VARCHAR UNIQUE,
    name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    bio VARCHAR(280),
    role_primary role_enum,
    role_secondary role_enum,
    skills TEXT[],
    availability availability_enum,
    win_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    last_active_at TIMESTAMPTZ DEFAULT now()
);

-- SWIPES TABLE
CREATE TYPE direction_enum AS ENUM ('like', 'pass');

CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    swiped_id UUID REFERENCES users(id) ON DELETE CASCADE,
    direction direction_enum NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(swiper_id, swiped_id)
);

-- MATCHES TABLE
CREATE TYPE match_status_enum AS ENUM ('active', 'archived', 'blocked');

CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_a_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_b_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status match_status_enum DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT enforce_ordering CHECK (user_a_id < user_b_id),
    UNIQUE(user_a_id, user_b_id)
);

-- MESSAGES TABLE
CREATE TYPE message_type_enum AS ENUM ('text', 'code', 'link', 'file');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type message_type_enum DEFAULT 'text',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS) configuration

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view active users, only owner can edit
CREATE POLICY "Users can view active profiles" ON users FOR SELECT USING (is_active = true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Swipes: Users can only see their own swipes and create their own
CREATE POLICY "Users can view own swipes" ON swipes FOR SELECT USING (auth.uid() = swiper_id);
CREATE POLICY "Users can insert own swipes" ON swipes FOR INSERT WITH CHECK (auth.uid() = swiper_id);

-- Matches: Users can only see matches they are part of
CREATE POLICY "Users can view own matches" ON matches FOR SELECT USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Messages: Users can see messages in their matches and send messages in their matches
CREATE POLICY "Users can view match messages" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM matches m WHERE m.id = messages.match_id AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
);
CREATE POLICY "Users can send match messages" ON messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND 
    EXISTS (
        SELECT 1 FROM matches m WHERE m.id = messages.match_id AND (m.user_a_id = auth.uid() OR m.user_b_id = auth.uid())
    )
);
