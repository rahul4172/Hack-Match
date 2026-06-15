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
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ['JWT_SECRET', 'CORS_ORIGIN'];
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
  res.json({ status: "ok", env: process.env.NODE_ENV, timestamp: Date.now() });
});

const apiLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 200 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many attempts. Try again later.' } });

app.use('/users', apiLimiter);
app.use('/connections', apiLimiter);
app.use('/messages', apiLimiter);
app.use('/projects', apiLimiter);
app.use('/spotlight', apiLimiter);

initDB().then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to protect routes
function authenticate(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------------- AUTHENTICATION ----------------
app.post('/auth/signup', authLimiter, (req, res) => {
  const { email, password, name, public_key } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const id = crypto.randomUUID();
    const hash = bcrypt.hashSync(password, 10);
    
    db.prepare(`
      INSERT INTO users (id, email, password, name, bio, skills, role, public_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, email, hash, name, 'Ready to build something awesome.', '[]', 'Developer', public_key || null);

    const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, email, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/signin', authLimiter, (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
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

app.post('/auth/guest', authLimiter, (req, res) => {
  try {
    const id = crypto.randomUUID();
    const guestEmail = `guest_${id.substring(0, 8)}@temp.com`;
    const hash = bcrypt.hashSync(crypto.randomUUID(), 10);
    
    db.prepare(`
      INSERT INTO users (id, email, password, name, bio, skills, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, guestEmail, hash, 'Guest User', 'Testing out the platform for 10 minutes.', '["React", "Node"]', 'Guest Explorer');

    // Token explicitly expires in 10 minutes
    const token = jwt.sign({ id, email: guestEmail, is_guest: true }, JWT_SECRET, { expiresIn: '10m' });
    res.json({ token, user: { id, email: guestEmail, name: 'Guest User', role: 'Guest Explorer', is_guest: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/logout', authenticate, (req, res) => {
  try {
    if (req.user.is_guest) {
      // Clean up guest data forever
      db.prepare('DELETE FROM connections WHERE sender_id = ? OR receiver_id = ?').run(req.user.id, req.user.id);
      db.prepare('DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?').run(req.user.id, req.user.id);
      db.prepare('DELETE FROM team_signals WHERE user_id = ?').run(req.user.id);
      db.prepare('DELETE FROM ideas WHERE creator_id = ?').run(req.user.id);
      db.prepare('DELETE FROM users WHERE id = ?').run(req.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/auth/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.hack_score = calculateHackScore(user.id);
    delete user.password;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- USERS & PROFILES ----------------
function calculateHackScore(userId) {
  let score = 0;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return 0;
  if (user.winnings && user.winnings.length > 5) score += 50;
  if (user.learnings && user.learnings.length > 5) score += 50;
  if (user.github && user.github.length > 2) score += 50;
  if (user.linkedin && user.linkedin.length > 2) score += 50;
  
  const accepted = db.prepare('SELECT count(*) as count FROM connections WHERE (sender_id = ? OR receiver_id = ?) AND status = "accepted"').get(userId, userId).count;
  score += accepted * 20;
  
  db.prepare('UPDATE users SET hack_score = ? WHERE id = ?').run(score, userId);
  return score;
}
function calculateSynergy(u1, u2) {
  let score = 50;
  const r1 = (u1.role || '').toLowerCase();
  const r2 = (u2.role || '').toLowerCase();
  if ((r1.includes('front') && r2.includes('back')) || (r1.includes('back') && r2.includes('front'))) {
    score += 30;
  } else if ((r1.includes('ai') && r2.includes('back')) || (r2.includes('ai') && r1.includes('back'))) {
    score += 20;
  } else if (r1 === r2 && r1 !== '') {
    score -= 10;
  }
  let s1 = [], s2 = [];
  try { s1 = JSON.parse(u1.skills || '[]'); } catch(e){}
  try { s2 = JSON.parse(u2.skills || '[]'); } catch(e){}
  const sharedSkills = s1.filter(sk => s2.includes(sk)).length;
  score += (sharedSkills * 5);
  return Math.min(100, Math.max(0, score));
}

app.get('/users', authenticate, (req, res) => {
  try {
    const currentUser = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    const users = db.prepare('SELECT id, name, role, bio, skills, winnings, learnings, github, linkedin, avatar, public_key, hack_score FROM users WHERE id != ?').all(req.user.id);
    
    // Recalculate for everyone fetched (in v1 this would be async/cron, but for v0 dynamic is fine)
    users.forEach(u => u.hack_score = calculateHackScore(u.id));

    const withSynergy = users.map(u => ({ ...u, synergy_score: calculateSynergy(currentUser, u), type: 'person' }));
    withSynergy.sort((a,b) => b.synergy_score - a.synergy_score);

    // Fetch active ideas not created by the current user
    const ideas = db.prepare(`
      SELECT i.*, u.name as creator_name, u.avatar as creator_avatar, u.role as creator_role, u.hack_score as creator_hack_score 
      FROM ideas i 
      JOIN users u ON i.creator_id = u.id 
      WHERE i.creator_id != ? AND i.status = 'active'
    `).all(req.user.id);

    // Interleave 1 idea for every 4 people
    const deck = [];
    let ideaIdx = 0;
    withSynergy.forEach((person, idx) => {
      deck.push(person);
      if ((idx + 1) % 4 === 0 && ideaIdx < ideas.length) {
        deck.push({ ...ideas[ideaIdx], type: 'idea' });
        ideaIdx++;
      }
    });
    
    // Append any remaining ideas
    while(ideaIdx < ideas.length) {
      deck.push({ ...ideas[ideaIdx], type: 'idea' });
      ideaIdx++;
    }

    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/profile', authenticate, (req, res) => {
  const { name, bio, skills, winnings, learnings, github, linkedin, role } = req.body;
  try {
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    const updatedName = name !== undefined ? name : existing.name;
    const updatedBio = bio !== undefined ? bio : existing.bio;
    const updatedSkills = skills !== undefined ? skills : existing.skills;
    const updatedWinnings = winnings !== undefined ? winnings : existing.winnings;
    const updatedLearnings = learnings !== undefined ? learnings : existing.learnings;
    const updatedGithub = github !== undefined ? github : existing.github;
    const updatedLinkedin = linkedin !== undefined ? linkedin : existing.linkedin;
    const updatedRole = role !== undefined ? role : existing.role;

    db.prepare(`
      UPDATE users 
      SET name = ?, bio = ?, skills = ?, winnings = ?, learnings = ?, github = ?, linkedin = ?, role = ?
      WHERE id = ?
    `).run(
      updatedName || null,
      updatedBio || null,
      updatedSkills || null,
      updatedWinnings || null,
      updatedLearnings || null,
      updatedGithub || null,
      updatedLinkedin || null,
      updatedRole || null,
      req.user.id
    );
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    delete user.password;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/:id', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, role, bio, skills, winnings, learnings, github, linkedin, avatar, public_key, hack_score FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.hack_score = calculateHackScore(user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- IDEAS ----------------
app.post('/ideas', authenticate, (req, res) => {
  const { title, pitch, roles_needed } = req.body;
  if (!title || !pitch || !roles_needed) return res.status(400).json({ error: 'title, pitch, and roles_needed required' });
  try {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO ideas (id, creator_id, title, pitch, roles_needed) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.user.id, title, pitch, roles_needed);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- TEAM SIGNALS ----------------
app.post('/signals', authenticate, (req, res) => {
  const { message, role_needed } = req.body;
  if (!message || !role_needed) return res.status(400).json({ error: 'message and role_needed required' });
  try {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(); // 6 hours from now
    db.prepare('INSERT INTO team_signals (id, user_id, message, role_needed, expires_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, req.user.id, message, role_needed, expiresAt);
    res.json({ id, message, role_needed, expires_at: expiresAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/signals/active', authenticate, (req, res) => {
  try {
    const now = new Date().toISOString();
    const signals = db.prepare(`
      SELECT s.*, u.name, u.avatar, u.role, u.hack_score
      FROM team_signals s
      JOIN users u ON s.user_id = u.id
      WHERE s.expires_at > ?
      ORDER BY s.created_at DESC
    `).all(now);
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HACKATHONS (RADAR) ----------------
app.get('/hackathons', authenticate, async (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    let userSkills = [];
    try { userSkills = JSON.parse(user.skills || '[]'); } catch(e){}

    let externalHackathons = [];
    try {
      const response = await fetch('https://devpost.com/hackathons?status[]=upcoming&status[]=open', {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const html = await response.text();
      const $ = cheerio.load(html);
      
      $('.hackathon-tile').each((i, el) => {
        if (i >= 15) return; // limit to 15
        const name = $(el).find('h3').text().trim() || 'Unknown Hackathon';
        const date = $(el).find('.submission-period').text().trim() || 'TBA';
        const prize_pool = $(el).find('.prize-amount').text().trim() || 'Prizes TBA';
        const url = $(el).find('a').attr('href') || '';
        
        const id = crypto.createHash('md5').update(url + name).digest('hex').substring(0, 16);
        
        externalHackathons.push({
          id,
          name,
          date,
          prize_pool,
          tech_stack_focus: 'Open Stack (React, Node, Python, AI)',
          team_size: '1-4',
          url
        });
      });
    } catch (e) {
      console.log('Failed to scrape devpost:', e.message);
    }
    
    // Fallback to local DB hackathons if Devpost scraping yielded nothing
    if (externalHackathons.length === 0) {
      externalHackathons = db.prepare('SELECT * FROM hackathons ORDER BY created_at DESC').all();
    }

    const withFitScore = externalHackathons.map(h => {
      let score = 50 + Math.floor(Math.random() * 20); // base score with slight variance
      const hTags = h.tech_stack_focus.toLowerCase().split(',').map(s => s.trim());
      const uTags = userSkills.map(s => s.toLowerCase());
      
      const overlap = uTags.filter(ut => hTags.some(ht => ht.includes(ut) || ut.includes(ht))).length;
      score += (overlap * 15);
      
      const joined = db.prepare('SELECT * FROM user_hackathons WHERE user_id = ? AND hackathon_id = ?').get(req.user.id, h.id);

      return {
        ...h,
        fit_score: Math.min(100, score),
        joined: !!joined
      };
    });

    withFitScore.sort((a, b) => b.fit_score - a.fit_score);
    res.json(withFitScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/hackathons/:id/join', authenticate, (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM user_hackathons WHERE user_id = ? AND hackathon_id = ?').get(req.user.id, req.params.id);
    if (!existing) {
      db.prepare('INSERT INTO user_hackathons (user_id, hackathon_id) VALUES (?, ?)').run(req.user.id, req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CONNECTIONS ----------------
app.post('/connections/request', authenticate, (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId) return res.status(400).json({ error: 'receiverId is required' });
  try {
    const existing = db.prepare('SELECT id FROM connections WHERE sender_id = ? AND receiver_id = ?').get(req.user.id, receiverId);
    if (existing) return res.status(400).json({ error: 'Request already sent' });

    db.prepare('INSERT INTO connections (id, sender_id, receiver_id) VALUES (?, ?, ?)')
      .run(crypto.randomUUID(), req.user.id, receiverId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/connections/accept', authenticate, (req, res) => {
  const { senderId } = req.body;
  try {
    db.prepare('UPDATE connections SET status = ? WHERE sender_id = ? AND receiver_id = ?')
      .run('accepted', senderId, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/connections', authenticate, (req, res) => {
  try {
    // Get pending requests received by current user
    const pending = db.prepare(`
      SELECT c.*, u.name, u.bio, u.avatar, u.role
      FROM connections c
      JOIN users u ON c.sender_id = u.id
      WHERE c.receiver_id = ? AND c.status = 'pending'
    `).all(req.user.id);

    // Get accepted connections (both directions)
    const accepted = db.prepare(`
      SELECT c.*, 
        CASE WHEN c.sender_id = ? THEN ru.id ELSE su.id END as user_id,
        CASE WHEN c.sender_id = ? THEN ru.name ELSE su.name END as name,
        CASE WHEN c.sender_id = ? THEN ru.avatar ELSE su.avatar END as avatar,
        CASE WHEN c.sender_id = ? THEN ru.role ELSE su.role END as role,
        CASE WHEN c.sender_id = ? THEN ru.public_key ELSE su.public_key END as public_key
      FROM connections c
      JOIN users su ON c.sender_id = su.id
      JOIN users ru ON c.receiver_id = ru.id
      WHERE (c.sender_id = ? OR c.receiver_id = ?) AND c.status = 'accepted'
    `).all(req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id, req.user.id);

    res.json({ pending, accepted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/nearby', authenticate, (req, res) => {
  // Mock nearby users
  res.json([
    {
      id: crypto.randomUUID(),
      name: 'Sarah Chen',
      role: 'Full Stack Engineer',
      bio: 'Building scalable web apps. Looking for a weekend hackathon team!',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      location: 'San Francisco, CA (2 miles away)',
      tech_stack: ['React', 'TypeScript', 'Node.js']
    },
    {
      id: crypto.randomUUID(),
      name: 'David Kumar',
      role: 'AI / ML Researcher',
      bio: 'Training tiny LLMs on edge devices. Let\'s build the next AI agent.',
      avatar: 'https://i.pravatar.cc/150?u=david',
      location: 'San Francisco, CA (5 miles away)',
      tech_stack: ['Python', 'PyTorch', 'C++']
    },
    {
      id: crypto.randomUUID(),
      name: 'Elena Rodriguez',
      role: 'Product Designer',
      bio: 'UI/UX enthusiast. I make things look pretty and user-friendly.',
      avatar: 'https://i.pravatar.cc/150?u=elena',
      location: 'San Jose, CA (40 miles away)',
      tech_stack: ['Figma', 'Framer', 'CSS']
    }
  ]);
});

// ---------------- STACK CLASH ----------------
app.post('/connections/:id/clash', authenticate, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  try {
    const conn = db.prepare('SELECT * FROM connections WHERE id = ? AND (sender_id = ? OR receiver_id = ?)').get(req.params.id, req.user.id, req.user.id);
    if (!conn) return res.status(403).json({ error: 'Connection not found' });

    db.prepare('INSERT INTO stack_clashes (id, connection_id, user_id, code) VALUES (?, ?, ?, ?)')
      .run(crypto.randomUUID(), conn.id, req.user.id, code);
      
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/connections/:userId/clashes', authenticate, (req, res) => {
  const otherId = req.params.userId;
  try {
    const conn = db.prepare(`
      SELECT id FROM connections 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
      AND status = 'accepted'
    `).get(req.user.id, otherId, otherId, req.user.id);

    if (!conn) return res.json({ clashes: [] });

    const clashes = db.prepare(`
      SELECT c.*, u.name 
      FROM stack_clashes c 
      JOIN users u ON c.user_id = u.id
      WHERE c.connection_id = ?
    `).all(conn.id);

    res.json({ connectionId: conn.id, clashes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CHAT ----------------
app.post('/messages', authenticate, (req, res) => {
  const { receiverId, content } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: 'receiverId and content required' });

  try {
    // Verify they are connected
    const conn = db.prepare(`
      SELECT id FROM connections 
      WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)) 
      AND status = 'accepted'
    `).get(req.user.id, receiverId, receiverId, req.user.id);

    if (!conn) return res.status(403).json({ error: 'Users are not connected' });

    const msgId = crypto.randomUUID();
    db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)')
      .run(msgId, req.user.id, receiverId, content);
      
    res.json({ id: msgId, sender_id: req.user.id, receiver_id: receiverId, content, created_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages/:userId', authenticate, (req, res) => {
  const otherId = req.params.userId;
  try {
    const messages = db.prepare(`
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
app.get('/spotlight', authenticate, (req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*, u.name as author_name, u.avatar as author_avatar
      FROM projects p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/projects', authenticate, (req, res) => {
  const { title, description, link, tags } = req.body;
  try {
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO projects (id, user_id, title, description, link, tags) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, req.user.id, title, description, link, tags);
    res.json({ id, title, description, link, tags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DEBRIEFS & STORIES ----------------
app.post('/debriefs', authenticate, (req, res) => {
  const { hackathon_id, project_link, hardest_challenge, do_differently, teammate_rating, teammate_tags, hack_again } = req.body;
  if (!hackathon_id || !project_link) return res.status(400).json({ error: 'hackathon_id and project_link required' });
  try {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO debriefs (id, hackathon_id, user_id, project_link, hardest_challenge, do_differently, teammate_rating, teammate_tags, hack_again)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, hackathon_id, req.user.id, project_link, hardest_challenge, do_differently, teammate_rating || 0, teammate_tags || '', hack_again || '');
    
    // Feed reputation
    if (teammate_rating >= 4) {
      db.prepare('INSERT INTO reputation (id, user_id, score_component, points) VALUES (?, ?, ?, ?)')
        .run(crypto.randomUUID(), req.user.id, 'High teammate rating', 25);
      
      const currentScore = db.prepare('SELECT hack_score FROM users WHERE id = ?').get(req.user.id).hack_score;
      db.prepare('UPDATE users SET hack_score = ? WHERE id = ?').run(currentScore + 25, req.user.id);
    }
    
    res.json({ id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stories/:id', (req, res) => {
  try {
    const debrief = db.prepare(`
      SELECT d.*, u.name as user_name, u.avatar as user_avatar, h.name as hackathon_name
      FROM debriefs d
      JOIN users u ON d.user_id = u.id
      JOIN hackathons h ON d.hackathon_id = h.id
      WHERE d.id = ?
    `).get(req.params.id);
    
    if (!debrief) return res.status(404).json({ error: 'Story not found' });
    res.json(debrief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../public')));

// Fallback to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});
