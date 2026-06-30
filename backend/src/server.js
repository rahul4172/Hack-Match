import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import * as cheerio from 'cheerio';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import { initDB } from './db.js';
import User from './models/User.js';
import Project from './models/Project.js';
import Connection from './models/Connection.js';
import Message from './models/Message.js';
import TeamSignal from './models/TeamSignal.js';
import Idea from './models/Idea.js';
import Hackathon from './models/Hackathon.js';
import UserHackathon from './models/UserHackathon.js';
import StackClash from './models/StackClash.js';
import Squad from './models/Squad.js';
import Reputation from './models/Reputation.js';
import Debrief from './models/Debrief.js';

import {
  pickChallenge,
  validateSubmission,
  getChallengePublic,
} from './clashChallenges.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredEnv = ['JWT_SECRET', 'MONGODB_URI'];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});

const app = express();
app.set('trust proxy', 1); // Trust the reverse proxy (e.g. Render/Vercel) to properly identify IPs for rate limiting
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, db: 'mongodb', timestamp: Date.now() });
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
    if (!mongoose.Types.ObjectId.isValid(req.user.id)) {
      return res.status(401).json({ error: 'Session expired (migrated to MongoDB). Please log out and log in again.' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

async function calculateHackScore(userId) {
  let score = 0;
  const user = await User.findById(userId);
  if (!user) return 0;
  if (user.winnings && user.winnings.length > 5) score += 50;
  if (user.learnings && user.learnings.length > 5) score += 50;
  if (user.github && user.github.length > 2) score += 50;
  if (user.linkedin && user.linkedin.length > 2) score += 50;

  const count = await Connection.countDocuments({
    $or: [{ sender_id: userId }, { receiver_id: userId }],
    status: 'accepted'
  });
  score += count * 20;

  await User.findByIdAndUpdate(userId, { hack_score: score });
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

  if (u1.location && u2.location && u1.location.trim() !== '') {
    const loc1 = u1.location.toLowerCase();
    const loc2 = u2.location.toLowerCase();
    if (loc1.includes(loc2) || loc2.includes(loc1)) score += 50;
  }

  return Math.min(100, Math.max(0, score));
}

// ---------------- AUTH ----------------
app.post('/auth/signup', authLimiter, async (req, res) => {
  const { email, password, name, public_key } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name are required' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hash = bcrypt.hashSync(password, 10);
    const user = await User.create({
      email, password: hash, name, bio: 'Ready to build something awesome.', skills: '[]', role: 'Developer', public_key: public_key || null
    });

    const token = jwt.sign({ id: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/signin', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    const userObj = user.toJSON();
    delete userObj.password;
    res.json({ token, user: userObj });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/guest', authLimiter, async (req, res) => {
  try {
    const idStr = crypto.randomUUID().substring(0, 8);
    const guestEmail = `guest_${idStr}@temp.com`;
    const hash = bcrypt.hashSync(crypto.randomUUID(), 10);
    const user = await User.create({
      email: guestEmail, password: hash, name: 'Guest User', bio: 'Testing out the platform for 10 minutes.', skills: '["React", "Node"]', role: 'Guest Explorer'
    });

    const token = jwt.sign({ id: user._id, email: guestEmail, is_guest: true }, JWT_SECRET, { expiresIn: '10m' });
    res.json({ token, user: { id: user._id, email: guestEmail, name: 'Guest User', role: 'Guest Explorer', is_guest: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/auth/logout', authenticate, async (req, res) => {
  try {
    if (req.user.is_guest) {
      await Connection.deleteMany({ $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }] });
      await Message.deleteMany({ $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }] });
      await TeamSignal.deleteMany({ user_id: req.user.id });
      await Idea.deleteMany({ creator_id: req.user.id });
      await User.findByIdAndDelete(req.user.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/auth/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userObj = user.toJSON();
    userObj.hack_score = await calculateHackScore(user._id);
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- USERS ----------------
app.get('/users', authenticate, async (req, res) => {
  try {
    const { roles, skills, search } = req.query;
    const currentUser = await User.findById(req.user.id);
    
    // Exclude users already interacted with (swiped right/left or connected)
    const connections = await Connection.find({
      $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }]
    });
    
    const excludeIds = [req.user.id];
    for (const conn of connections) {
      if (conn.sender_id.toString() === req.user.id) excludeIds.push(conn.receiver_id.toString());
      if (conn.receiver_id.toString() === req.user.id) excludeIds.push(conn.sender_id.toString());
    }

    const query = { _id: { $nin: excludeIds } };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }

    let users = await User.find(query);

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

    const withSynergy = [];
    for (let u of users) {
      const score = await calculateHackScore(u._id);
      const uObj = u.toJSON();
      uObj.hack_score = score;
      uObj.synergy_score = calculateSynergy(currentUser, uObj);
      uObj.type = 'person';
      delete uObj.password;
      withSynergy.push(uObj);
    }

    withSynergy.sort((a, b) => b.synergy_score - a.synergy_score);

    const ideas = await Idea.find({ creator_id: { $ne: req.user.id }, status: 'active' }).populate('creator_id');
    const formattedIdeas = ideas.map(i => {
      const iObj = i.toJSON();
      if (i.creator_id) {
        iObj.creator_name = i.creator_id.name;
        iObj.creator_avatar = i.creator_id.avatar;
        iObj.creator_role = i.creator_id.role;
        iObj.creator_hack_score = i.creator_id.hack_score;
        iObj.creator_id = i.creator_id._id;
      }
      iObj.type = 'idea';
      return iObj;
    });

    const deck = [];
    let ideaIdx = 0;
    withSynergy.forEach((person, idx) => {
      deck.push(person);
      if ((idx + 1) % 4 === 0 && ideaIdx < formattedIdeas.length) {
        deck.push(formattedIdeas[ideaIdx]);
        ideaIdx++;
      }
    });
    while (ideaIdx < formattedIdeas.length) {
      deck.push(formattedIdeas[ideaIdx]);
      ideaIdx++;
    }
    res.json(deck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/profile', authenticate, async (req, res) => {
  const { name, bio, skills, winnings, learnings, github, linkedin, role, location, public_key } = req.body;
  try {
    const existing = await User.findById(req.user.id);
    if (!existing) return res.status(404).json({ error: 'User not found' });

    existing.name = name ?? existing.name;
    existing.bio = bio ?? existing.bio;
    existing.skills = skills ?? existing.skills;
    existing.winnings = winnings ?? existing.winnings;
    existing.learnings = learnings ?? existing.learnings;
    existing.github = github ?? existing.github;
    existing.linkedin = linkedin ?? existing.linkedin;
    existing.role = role ?? existing.role;
    existing.location = location ?? existing.location;
    if (public_key !== undefined) existing.public_key = public_key;

    await existing.save();

    const userObj = existing.toJSON();
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/users/nearby', authenticate, (req, res) => {
  res.json([
    { id: new mongoose.Types.ObjectId().toHexString(), name: 'Sarah Chen', role: 'Full Stack Engineer', bio: 'Building scalable web apps. Looking for a weekend hackathon team!', avatar: 'https://i.pravatar.cc/150?u=sarah', location: 'San Francisco, CA (2 miles away)', tech_stack: ['React', 'TypeScript', 'Node.js'] },
    { id: new mongoose.Types.ObjectId().toHexString(), name: 'David Kumar', role: 'AI / ML Researcher', bio: "Training tiny LLMs on edge devices. Let's build the next AI agent.", avatar: 'https://i.pravatar.cc/150?u=david', location: 'San Francisco, CA (5 miles away)', tech_stack: ['Python', 'PyTorch', 'C++'] },
    { id: new mongoose.Types.ObjectId().toHexString(), name: 'Elena Rodriguez', role: 'Product Designer', bio: 'UI/UX enthusiast. I make things look pretty and user-friendly.', avatar: 'https://i.pravatar.cc/150?u=elena', location: 'San Jose, CA (40 miles away)', tech_stack: ['Figma', 'Framer', 'CSS'] },
  ]);
});

app.get('/users/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Invalid user ID' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userObj = user.toJSON();
    userObj.hack_score = await calculateHackScore(user._id);
    delete userObj.password;
    res.json(userObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- IDEAS & SIGNALS ----------------
app.post('/ideas', authenticate, async (req, res) => {
  const { title, pitch, roles_needed } = req.body;
  if (!title || !pitch || !roles_needed) return res.status(400).json({ error: 'title, pitch, and roles_needed required' });
  try {
    const idea = await Idea.create({ creator_id: req.user.id, title, pitch, roles_needed });
    res.json({ success: true, id: idea._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/signals', authenticate, async (req, res) => {
  const { message, role_needed } = req.body;
  if (!message || !role_needed) return res.status(400).json({ error: 'message and role_needed required' });
  try {
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    const sig = await TeamSignal.create({ user_id: req.user.id, message, role_needed, expires_at: expiresAt });
    res.json({ id: sig._id, message, role_needed, expires_at: expiresAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/signals/active', authenticate, async (req, res) => {
  try {
    const signals = await TeamSignal.find({ expires_at: { $gt: new Date() } }).sort({ created_at: -1 }).populate('user_id');
    const formatted = signals.map(s => {
      const sObj = s.toJSON();
      if (s.user_id) {
        sObj.name = s.user_id.name;
        sObj.avatar = s.user_id.avatar;
        sObj.role = s.user_id.role;
        sObj.hack_score = s.user_id.hack_score;
        sObj.user_id = s.user_id._id;
      }
      return sObj;
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- HACKATHONS ----------------
app.get('/hackathons', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
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
        // Fake ID for external
        const id = new mongoose.Types.ObjectId().toHexString();
        externalHackathons.push({ id, name, date, prize_pool, tech_stack_focus: 'Open Stack (React, Node, Python, AI)', team_size: '1-4', url });
      });
    } catch (e) {
      console.log('Failed to scrape devpost:', e.message);
    }

    const dbHackathons = await Hackathon.find().sort({ created_at: -1 });
    externalHackathons = [...externalHackathons, ...dbHackathons.map(h => h.toJSON())];

    const withFitScore = await Promise.all(externalHackathons.map(async h => {
      let score = 50 + Math.floor(Math.random() * 20);
      const hTags = (h.tech_stack_focus || '').toLowerCase().split(',').map(s => s.trim());
      const uTags = userSkills.map(s => s.toLowerCase());
      score += uTags.filter(ut => hTags.some(ht => ht.includes(ut) || ut.includes(ht))).length * 15;
      
      let joined = false;
      if (mongoose.Types.ObjectId.isValid(h.id)) {
        joined = !!(await UserHackathon.findOne({ user_id: req.user.id, hackathon_id: h.id }));
      }
      return { ...h, fit_score: Math.min(100, score), joined };
    }));

    withFitScore.sort((a, b) => b.fit_score - a.fit_score);
    res.json(withFitScore);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/hackathons/:id/join', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: 'Invalid hackathon ID' });
    const existing = await UserHackathon.findOne({ user_id: req.user.id, hackathon_id: req.params.id });
    if (!existing) await UserHackathon.create({ user_id: req.user.id, hackathon_id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/hackathons', authenticate, async (req, res) => {
  const { name, date, prize_pool, tech_stack_focus, team_size, platform, registration_url } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  
  try {
    const hackathon = await Hackathon.create({
      name,
      date,
      prize_pool,
      tech_stack_focus,
      team_size,
      platform,
      registration_url
    });
    res.json(hackathon.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- CONNECTIONS ----------------
app.post('/connections/request', authenticate, async (req, res) => {
  const { receiverId } = req.body;
  if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).json({ error: 'valid receiverId is required' });
  try {
    const existing = await Connection.findOne({ sender_id: req.user.id, receiver_id: receiverId });
    if (existing) return res.status(400).json({ error: 'Request already sent' });
    await Connection.create({ sender_id: req.user.id, receiver_id: receiverId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/connections/accept', authenticate, async (req, res) => {
  const { senderId } = req.body;
  try {
    await Connection.updateOne({ sender_id: senderId, receiver_id: req.user.id }, { status: 'accepted' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/connections', authenticate, async (req, res) => {
  try {
    const pendingConns = await Connection.find({ receiver_id: req.user.id, status: 'pending' }).populate('sender_id');
    const pending = pendingConns.map(c => {
      const cObj = c.toJSON();
      if (c.sender_id) {
        cObj.name = c.sender_id.name;
        cObj.bio = c.sender_id.bio;
        cObj.avatar = c.sender_id.avatar;
        cObj.role = c.sender_id.role;
        cObj.sender_id = c.sender_id._id;
      }
      return cObj;
    });

    const acceptedConns = await Connection.find({
      $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }],
      status: 'accepted'
    }).populate('sender_id receiver_id');

    const accepted = acceptedConns
      .filter(c => c.sender_id && c.receiver_id)
      .map(c => {
      const cObj = c.toJSON();
      const isSender = c.sender_id._id.toString() === req.user.id;
      const otherUser = isSender ? c.receiver_id : c.sender_id;
      
      cObj.user_id = otherUser._id;
      cObj.name = otherUser.name;
      cObj.avatar = otherUser.avatar;
      cObj.role = otherUser.role;
      cObj.public_key = otherUser.public_key;
      
      cObj.sender_id = c.sender_id._id;
      cObj.receiver_id = c.receiver_id._id;
      return cObj;
    });

    res.json({ pending, accepted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function getAcceptedConnection(userId, otherId) {
  return Connection.findOne({
    $or: [
      { sender_id: userId, receiver_id: otherId },
      { sender_id: otherId, receiver_id: userId }
    ],
    status: 'accepted'
  });
}

// ---------------- STACK CLASH ----------------
app.get('/connections/:userId/clash/challenge', authenticate, async (req, res) => {
  try {
    const conn = await getAcceptedConnection(req.user.id, req.params.userId);
    if (!conn) return res.status(403).json({ error: 'No accepted connection' });

    const challenge = pickChallenge(conn._id.toString());
    const reveal = req.query.reveal === 'true';

    if (reveal) {
      res.json({ connectionId: conn._id, challenge });
    } else {
      res.json({ connectionId: conn._id, challenge: getChallengePublic(challenge) });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/connections/:id/clash', authenticate, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'code is required' });
  try {
    const conn = await Connection.findOne({
      _id: req.params.id,
      $or: [{ sender_id: req.user.id }, { receiver_id: req.user.id }]
    });
    if (!conn) return res.status(403).json({ error: 'Connection not found' });

    const challenge = pickChallenge(conn._id.toString());
    if (!validateSubmission(challenge.id, code)) {
      return res.status(400).json({
        error: 'Solution does not pass validation. Check your logic and try again.',
        hint: challenge.hint,
      });
    }

    const existing = await StackClash.findOne({ connection_id: conn._id, user_id: req.user.id });
    if (!existing) {
      await StackClash.create({ connection_id: conn._id, user_id: req.user.id, challenge_id: challenge.id, code });
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

    const clashesRaw = await StackClash.find({ connection_id: conn._id }).populate('user_id');
    const clashes = clashesRaw.map(c => {
      const cObj = c.toJSON();
      if (c.user_id) {
        cObj.name = c.user_id.name;
        cObj.user_id = c.user_id._id;
      }
      return cObj;
    });

    res.json({ connectionId: conn._id, clashes });
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

    const msg = await Message.create({ sender_id: req.user.id, receiver_id: receiverId, content });
    res.json(msg.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/messages/:userId', authenticate, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender_id: req.user.id, receiver_id: otherId },
        { sender_id: otherId, receiver_id: req.user.id }
      ]
    }).sort({ created_at: 1 });
    res.json(messages.map(m => m.toJSON()));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SPOTLIGHT ----------------
app.get('/spotlight', authenticate, async (req, res) => {
  try {
    const projectsRaw = await Project.find().sort({ created_at: -1 }).populate('user_id');
    const projects = projectsRaw.map(p => {
      const pObj = p.toJSON();
      if (p.user_id) {
        pObj.author_name = p.user_id.name;
        pObj.author_avatar = p.user_id.avatar;
        pObj.user_id = p.user_id._id;
      }
      return pObj;
    });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/projects', authenticate, async (req, res) => {
  const { title, description, link, tags } = req.body;
  try {
    const project = await Project.create({ user_id: req.user.id, title, description, link, tags });
    res.json(project.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DEBRIEFS ----------------
app.post('/debriefs', authenticate, async (req, res) => {
  const { hackathon_id, project_link, hardest_challenge, do_differently, teammate_rating, teammate_tags, hack_again } = req.body;
  if (!hackathon_id || !project_link) return res.status(400).json({ error: 'hackathon_id and project_link required' });
  try {
    const debrief = await Debrief.create({
      hackathon_id, user_id: req.user.id, project_link, hardest_challenge, do_differently,
      teammate_rating: teammate_rating || 0, teammate_tags: teammate_tags || '', hack_again: hack_again || ''
    });

    if (teammate_rating >= 4) {
      await Reputation.create({ user_id: req.user.id, score_component: 'High teammate rating', points: 25 });
      const current = await User.findById(req.user.id);
      if (current) {
        await User.findByIdAndUpdate(req.user.id, { hack_score: (current.hack_score || 0) + 25 });
      }
    }
    res.json({ id: debrief._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/stories/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Invalid story ID' });
    const debrief = await Debrief.findById(req.params.id).populate('user_id hackathon_id');
    if (!debrief) return res.status(404).json({ error: 'Story not found' });
    
    const dObj = debrief.toJSON();
    if (debrief.user_id) {
      dObj.user_name = debrief.user_id.name;
      dObj.user_avatar = debrief.user_id.avatar;
      dObj.user_id = debrief.user_id._id;
    }
    if (debrief.hackathon_id) {
      dObj.hackathon_name = debrief.hackathon_id.name;
      dObj.hackathon_id = debrief.hackathon_id._id;
    }
    res.json(dObj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- SQUADS ----------------
app.post('/squads', authenticate, async (req, res) => {
  const { name, hackathon_name } = req.body;
  if (!name || !hackathon_name) return res.status(400).json({ error: 'Name and hackathon_name required' });
  
  try {
    const join_code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
    const squad = await Squad.create({
      name,
      hackathon_name,
      join_code,
      creator_id: req.user.id,
      members: [req.user.id]
    });
    res.json(squad.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/squads/join', authenticate, async (req, res) => {
  const { join_code } = req.body;
  if (!join_code) return res.status(400).json({ error: 'join_code required' });
  
  try {
    const squad = await Squad.findOne({ join_code: join_code.toUpperCase() });
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    
    if (!squad.members.includes(req.user.id)) {
      squad.members.push(req.user.id);
      await squad.save();
      res.json(squad.toJSON());
    } else {
      res.status(400).json({ error: 'You are already a member of this squad' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/squads', authenticate, async (req, res) => {
  try {
    const squads = await Squad.find({ members: req.user.id })
      .populate('members', 'name avatar role')
      .sort({ created_at: -1 });
    res.json(squads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/squads/:id/rename', authenticate, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Invalid squad ID' });
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    if (squad.creator_id.toString() !== req.user.id) return res.status(403).json({ error: 'Only the creator can rename the squad' });
    
    squad.name = name;
    await squad.save();
    res.json(squad.toJSON());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/squads/:id/leave', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Invalid squad ID' });
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    if (squad.creator_id.toString() === req.user.id) return res.status(400).json({ error: 'The creator cannot leave the squad. Disband it instead.' });
    if (!squad.members.includes(req.user.id)) return res.status(400).json({ error: 'You are not in this squad' });
    
    squad.members = squad.members.filter(mId => mId.toString() !== req.user.id);
    await squad.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/squads/:id', authenticate, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({ error: 'Invalid squad ID' });
    const squad = await Squad.findById(req.params.id);
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    if (squad.creator_id.toString() !== req.user.id) return res.status(403).json({ error: 'Only the creator can disband the squad' });
    
    await Squad.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'HackMatch API is running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});
