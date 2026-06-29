import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import db, { initDB } from './db.js';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  pickChallenge,
  validateSubmission,
  getChallengePublic,
} from './clashChallenges.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ['JWT_SECRET', 'CORS_ORIGIN', 'DATABASE_URL'];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, db: 'supabase-postgres', timestamp: Date.now() });
});

const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many attempts. Try again later.' } });

app.use('/users', apiLimiter);
app.use('/connections', apiLimiter);
app.use('/messages', apiLimiter);
app.use('/projects', apiLimiter);
app.use('/spotlight', apiLimiter);

initDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Failed to init database:', err.message);
  process.exit(1);
});

const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function calculateHackScore(userId) {
  let score = 0;
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return 0;
  if (user.winnings && user.winnings.length > 5) score += 50;
  if (user.learnings && user.learnings.length > 5) score += 50;
  if (user.github && user.github.length > 2) score += 50;
  if (user.linkedin && user.linkedin.length > 2) score += 50;

  const row = await db.prepare('SELECT count(*) as count FROM connections WHERE (sender_id = ? OR receiver_id = ?) AND status = ?').get(userId, userId, 'accepted');
  score += Number(row?.count || 0) * 20;

  await db.prepare('UPDATE users SET hack_score = ? WHERE id = ?').run(score, userId);
  return score;
}

function calculateSynergy(u1, u2) {
  let score = 50;
  const r1 = (u1.role || '').toLowerCase();
  const r2 = (u2.role || '').toLowerCase();
  if ((r1.includes('front') && r2.includes('back')) || (r1.includes('back') && r2.includes('front'))) score += 30;
  else if ((r1.includes('ai') && r2.includes('back')) || (r2.includes('ai') && r1.includes('back'))) score += 20;
  else if (r1 === r2 && r1 !== '') score -= 10;

  let s1 = [], s2 = [];
  try { s1 = JSON.parse(u1.skills || '[]'); } catch { /* ignore */ }
  try { s2 = JSON.parse(u2.skills || '[]'); } catch { /* ignore */ }
  score += s1.filter(sk => s2.includes(sk)).length * 5;
  return Math.min(100, Math.max(0, score));
}

// ---------------- AUTH ----------------
app.post('/auth/signup', authLimiter, async (req, res) => {
  const { email, password, name, public_key } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });
  try {
    const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    await db.prepare(`INSERT INTO users (id, email, password, name, bio, skills, role, public_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, email, hash, name, 'Ready to build something awesome.', '[]', 'Developer', public_key || null);

    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/signin', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/guest', authLimiter, async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const guestEmail = `guest_${id.substring(0, 8)}@temp.com`;
    const hash = bcrypt.hashSync(crypto.randomUUID(), 10);
    await db.prepare(`INSERT INTO users (id, email, password, name, bio, skills, role) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(id, guestEmail, hash, 'Guest User', 'Testing out the platform for 10 minutes.', '["React", "Node"]', 'Guest Explorer');

    const token = jwt.sign({ id, email: guestEmail, is_guest: true }, JWT_SECRET, { expiresIn: '10m' });
    res.json({ token, user: { id, email: guestEmail, name: 'Guest User', role: 'Guest Explorer', is_guest: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/logout', authenticate, async (req, res) => {
  try {
    if (req.user.is_guest) {
      await db.prepare('DELETE FROM connections WHERE sender_id = ? OR receiver_id = ?').run(req.user.id, req.user.id);
      await db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(req.user.id, req.user.id);
      await db.prepare('DELETE FROM team_signals WHERE user_id = ?').run(req.user.id);
      await db.prepare('DELETE FROM ideas WHERE creator_id = ?').run(req.user.id);
      await db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/auth/me', authenticate, async (req, res) => {
  try {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.hack_score = await calculateHackScore(user.id);
    delete user.password;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- USERS ----------------
app.get('/users', authenticate, async (req, res) => {
  try {
    const { roles, skills } = req.query;
    const currentUser = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    let users = await db.prepare('SELECT id, name, role, bio, skills, winnings, learnings, github, linkedin, avatar, public_key, hack_score FROM users WHERE id != ?').all(req.user.id);

    // Apply filtering
    if (roles) {
      const roleFilters = roles.split(',').map(r => r.trim().toLowerCase());
      users = users.filter(u => u.role && roleFilters.some(rf => u.role.toLowerCase().includes(rf)));
    }
    
    if (skills) {
      const skillFilters = skills.split(',').map(s => s.trim().toLowerCase());
      users = users.filter(u => {
        try {
          const userSkills = JSON.parse(u.skills || '[]').map(s => s.toLowerCase());
          return skillFilters.some(sf => userSkills.includes(sf));
        } catch(e) { return false; }
      });
    }

    for (const u of users) u.hack_score = await calculateHackScore(u.id);

    const withSynergy = users.map(u => ({ ...u, synergy_score: calculateSynergy(currentUser, u), type: 'person' }));
    withSynergy.sort((a, b) => b.synergy_score - a.synergy_score);

    const ideas = await db.prepare(`
      SELECT i.*, u.name as creator_name, u.avatar as creator_avatar, u.role as creator_role, u.hack_score as creator_hack_score
      FROM ideas i JOIN users u ON i.creator_id = u.id
      WHERE i.creator_id != ? AND i.status = 'active'
    `).all(req.user.id);

    const deck = [];
    let ideaIdx = 0;
    withSynergy.forEach((person, idx) => {
      deck.push(person);
      if ((idx + 1) % 4 === 0 && ideaIdx < ideas.length) {
        deck.push({ ...ideas[ideaIdx], type: 'idea' });
        ideaIdx++;
      }
    });
    while (ideaIdx < ideas.length) {
      deck.push({ ...ideas[ideaIdx], type: 'idea' });
      ideaIdx++;
    }
    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/profile', authenticate, async (req, res) => {
  const { name, bio, skills, winnings, learnings, github, linkedin, role, public_key } = req.body;
  try {
    const existing = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    await db.prepare(`
      UPDATE users SET name = ?, bio = ?, skills = ?, winnings = ?, learnings = ?, github = ?, linkedin = ?, role = ?, public_key = COALESCE(?, public_key)
      WHERE id = ?
    `).run(
      name ?? existing.name,
      bio ?? existing.bio,
      skills ?? existing.skills,
      winnings ?? existing.winnings,
      learnings ?? existing.learnings,
      github ?? existing.github,
      linkedin ?? existing.linkedin,
      role ?? existing.role,
      public_key ?? null,
      req.user.id
    );

    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    delete user.password;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', authenticate, async (req, res) => {
  try {
    const user = await db.prepare('SELECT id, name, role, bio, skills, winnings, learnings, github, linkedin, avatar, public_key, hack_score FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.hack_score = await calculateHackScore(user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/nearby', authenticate, (req, res) => {
  res.json([
    { id: crypto.randomUUID(), name: 'Sarah Chen', role: 'Full Stack Engineer', bio: 'Building scalable web apps. Looking for a weekend hackathon team!', avatar: 'https://i.pravatar.cc/150?u=sarah', location: 'San Francisco, CA (2 miles away)', tech_stack: ['React', 'TypeScript', 'Node.js'] },
    { id: crypto.randomUUID(), name: 'David Kumar', role: 'AI / ML Researcher', bio: "Training tiny LLMs on edge devices. Let's build the next AI agent.", avatar: 'https://i.pravatar.cc/150?u=david', location: 'San Francisco, CA (5 miles away)', tech_stack: ['Python', 'PyTorch', 'C++'] },
    { id: crypto.randomUUID(), name: 'Elena Rodriguez', role: 'Product Designer', bio: 'UI/UX enthusiast. I make things look pretty and user-friendly.', avatar: 'https://i.pravatar.cc/150?u=elena', location: 'San Jose, CA (40 miles away)', tech_stack: ['Figma', 'Framer', 'CSS'] },
  ]);
});

// ---------------- IDEAS & SIGNALS ----------------
app.post('/ideas', authenticate, async (req, res) => {
  const { title, pitch, roles_needed } = req.body;
  if (!title || !pitch || !roles_needed) return res.status(400).json({ error: 'title, pitch, and roles_needed required' });
  try {
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO ideas (id, creator_id, title, pitch, roles_needed) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, title, pitch, roles_needed);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/signals', authenticate, async (req, res) => {
  const { message, role_needed } = req.body;
  if (!message || !role_needed) return res.status(400).json({ error: 'message and role_needed required' });
  try {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    await db.prepare('INSERT INTO team_signals (id, user_id, message, role_needed, expires_at) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, message, role_needed, expiresAt);
    res.json({ id, message, role_needed, expires_at: expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/signals/active', authenticate, async (req, res) => {
  try {
    const now = new Date().toISOString();
    const signals = await db.prepare(`
      SELECT s.*, u.name, u.avatar, u.role, u.hack_score FROM team_signals s
      JOIN users u ON s.user_id = u.id WHERE s.expires_at > ? ORDER BY s.created_at DESC
    `).all(now);
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HACKATHONS ----------------
app.get('/hackathons', authenticate, async (req, res) => {
  try {
    const user = await db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    let userSkills = [];
    try { userSkills = JSON.parse(user.skills || '[]'); } catch { /* ignore */ }

    let externalHackathons = [];
    try {
      const response = await fetch('https://devpost.com/hackathons?status[]=upcoming&status[]=open', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      const html = await response.text();
      const $ = cheerio.load(html);
      $('.hackathon-tile').each((i, el) => {
        if (i >= 15) return;
        const name = $(el).find('h3').text().trim() || 'Unknown Hackathon';
        const date = $(el).find('.submission-period').text().trim() || 'TBA';
        const prize_pool = $(el).find('.prize-amount').text().trim() || 'Prizes TBA';
        const url = $(el).find('a').attr('href') || '';
        const id = crypto.createHash('md5').update(url + name).digest('hex').substring(0, 16);
        externalHackathons.push({ id, name, date, prize_pool, tech_stack_focus: 'Open Stack (React, Node, Python, AI)', team_size: '1-4', url });
      });
    } catch (e) {
      console.log('Failed to scrape devpost:', e.message);
    }

    const dbHackathons = await db.prepare('SELECT * FROM hackathons ORDER BY created_at DESC').all();
    externalHackathons = [...externalHackathons, ...dbHackathons];

    const withFitScore = await Promise.all(externalHackathons.map(async h => {
      let score = 50 + Math.floor(Math.random() * 20);
      const hTags = (h.tech_stack_focus || '').toLowerCase().split(',').map(s => s.trim());
      const uTags = userSkills.map(s => s.toLowerCase());
      score += uTags.filter(ut => hTags.some(ht => ht.includes(ut) || ut.includes(ht))).length * 15;
      const joined = await db.prepare('SELECT * FROM user_hackathons WHERE user_id = ? AND hackathon_id = ?').get(req.user.id, h.id);
      return { ...h, fit_score: Math.min(100, score), joined: !!joined };
    }));

    withFitScore.sort((a, b) => b.fit_score - a.fit_score);
    res.json(withFitScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/hackathons/:id/join', authenticate, async (req, res) => {
  try {
    const existing = await db.prepare('SELECT * FROM user_hackathons WHERE user_id = ? AND hackathon_id = ?').get(req.user.id, req.params.id);
    if (!existing) await db.prepare('INSERT INTO user_hackathons (user_id, hackathon_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CONNECTIONS ----------------
app.post('/connections/request', authenticate, async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
  try {
    const existing = await db.prepare('SELECT id FROM connections WHERE sender_id = ? AND receiver_id = ?').get(req.user.id, receiverId);
    if (existing) return res.status(400).json({ error: 'Request already sent' });
    await db.prepare('INSERT INTO connections (id, sender_id, receiver_id) VALUES (?, ?, ?)').run(crypto.randomUUID(), req.user.id, receiverId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/connections/accept', authenticate, async (req, res) => {
  const { senderId } = req.body;
  try {
    await db.prepare('UPDATE connections SET status = ? WHERE sender_id = ? AND receiver_id = ?').run('accepted', senderId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/connections', authenticate, async (req, res) => {
  try {
    const pending = await db.prepare(`
      SELECT c.*, u.name, u.bio, u.avatar, u.role FROM connections c
      JOIN users u ON c.sender_id = u.id WHERE c.receiver_id = ? AND c.status = 'pending'
    `).all(req.user.id);

    const accepted = await db.prepare(`
      SELECT c.*,
        CASE WHEN c.sender_id = ? THEN ru.id ELSE su.id END as user_id,
        CASE WHEN c.sender_id = ? THEN ru.name ELSE su.name END as name,
        CASE WHEN c.sender_id = ? THEN ru.avatar ELSE su.avatar END as avatar,
        CASE WHEN c.sender_id = ? THEN ru.role ELSE su.role END as role,
        CASE WHEN c.sender_id = ? THEN ru.public_key ELSE su.public_key END as public_key
      FROM connections c
      JOIN users su ON c.sender_id = su.id JOIN users ru ON c.receiver_id = ru.id
      WHERE (c.sender_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    res.json({ pending, accepted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getAcceptedConnection(userId, otherId) {
  return db.prepare(`
    SELECT id FROM connections
    WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) AND status = 'accepted'
  `).get(userId, otherId, otherId, userId);
}

// ---------------- STACK CLASH ----------------
app.get('/connections/:userId/clash/challenge', authenticate, async (req, res) => {
  try {
    const conn = await getAcceptedConnection(req.user.id, req.params.userId);
    if (!conn) return res.status(403).json({ error: 'No accepted connection' });

    const challenge = pickChallenge(conn.id);
    const reveal = req.query.reveal === 'true';

    if (reveal) {
      res.json({ connectionId: conn.id, challenge });
    } else {
      res.json({ connectionId: conn.id, challenge: getChallengePublic(challenge) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/connections/:id/clash', authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  try {
    const conn = await db.prepare('SELECT * FROM connections WHERE id = ? AND (sender_id = ? OR receiver_id = ?)').get(req.params.id, req.user.id, req.user.id);
    if (!conn) return res.status(403).json({ error: 'Connection not found' });

    const challenge = pickChallenge(conn.id);
    if (!validateSubmission(challenge.id, code)) {
      return res.status(400).json({
        error: 'Solution does not pass validation. Check your logic and try again.',
        hint: challenge.hint,
      });
    }

    const existing = await db.prepare('SELECT id FROM stack_clashes WHERE connection_id = ? AND user_id = ?').get(conn.id, req.user.id);
    if (!existing) {
      await db.prepare('INSERT INTO stack_clashes (id, connection_id, user_id, challenge_id, code) VALUES (?, ?, ?, ?, ?)')
        .run(crypto.randomUUID(), conn.id, req.user.id, challenge.id, code);
    }
    res.json({ success: true, challengeId: challenge.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/connections/:userId/clashes', authenticate, async (req, res) => {
  try {
    const conn = await getAcceptedConnection(req.user.id, req.params.userId);
    if (!conn) return res.json({ clashes: [] });

    const clashes = await db.prepare(`
      SELECT c.*, u.name FROM stack_clashes c JOIN users u ON c.user_id = u.id WHERE c.connection_id = ?
    `).all(conn.id);

    res.json({ connectionId: conn.id, clashes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- MESSAGES ----------------
app.post('/messages', authenticate, async (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });
  try {
    const conn = await getAcceptedConnection(req.user.id, receiverId);
    if (!conn) return res.status(403).json({ error: 'Users are not connected' });

    const msgId = crypto.randomUUID();
    await db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(msgId, req.user.id, receiverId, content);
    res.json({ id: msgId, sender_id: req.user.id, receiver_id: receiverId, content, created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const messages = await db.prepare(`
      SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(req.user.id, otherId, otherId, req.user.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SPOTLIGHT ----------------
app.get('/spotlight', authenticate, async (req, res) => {
  try {
    const projects = await db.prepare(`
      SELECT p.*, u.name as author_name, u.avatar as author_avatar FROM projects p
      JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC
    `).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/projects', authenticate, async (req, res) => {
  const { title, description, link, tags } = req.body;
  try {
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO projects (id, user_id, title, description, link, tags) VALUES (?, ?, ?, ?, ?, ?)').run(id, req.user.id, title, description, link, tags);
    res.json({ id, title, description, link, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DEBRIEFS ----------------
app.post('/debriefs', authenticate, async (req, res) => {
  const { hackathon_id, project_link, hardest_challenge, do_differently, teammate_rating, teammate_tags, hack_again } = req.body;
  if (!hackathon_id || !project_link) return res.status(400).json({ error: 'hackathon_id and project_link required' });
  try {
    const id = crypto.randomUUID();
    await db.prepare(`
      INSERT INTO debriefs (id, hackathon_id, user_id, project_link, hardest_challenge, do_differently, teammate_rating, teammate_tags, hack_again)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, hackathon_id, req.user.id, project_link, hardest_challenge, do_differently, teammate_rating || 0, teammate_tags || '', hack_again || '');

    if (teammate_rating >= 4) {
      await db.prepare('INSERT INTO reputation (id, user_id, score_component, points) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), req.user.id, 'High teammate rating', 25);
      const current = await db.prepare('SELECT hack_score FROM users WHERE id = ?').get(req.user.id);
      await db.prepare('UPDATE users SET hack_score = ? WHERE id = ?').run((current?.hack_score || 0) + 25, req.user.id);
    }
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stories/:id', async (req, res) => {
  try {
    const debrief = await db.prepare(`
      SELECT d.*, u.name as user_name, u.avatar as user_avatar, h.name as hackathon_name
      FROM debriefs d JOIN users u ON d.user_id = u.id JOIN hackathons h ON d.hackathon_id = h.id WHERE d.id = ?
    `).get(req.params.id);
    if (!debrief) return res.status(404).json({ error: 'Story not found' });
    res.json(debrief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
