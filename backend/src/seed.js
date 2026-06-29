import dotenv from 'dotenv';
dotenv.config();

import db, { initDB } from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

await initDB();
console.log('Seeding Supabase database...');

await db.exec('DELETE FROM messages');
await db.exec('DELETE FROM stack_clashes');
await db.exec('DELETE FROM connections');
await db.exec('DELETE FROM projects');
await db.exec('DELETE FROM team_signals');
await db.exec('DELETE FROM ideas');
await db.exec('DELETE FROM user_hackathons');
await db.exec('DELETE FROM debriefs');
await db.exec('DELETE FROM reputation');
await db.exec('DELETE FROM users');

const users = [
  { email: 'alice@example.com', password: 'password123', name: 'Alice Frontend', role: 'Frontend Developer', bio: 'React and Vue enthusiast. Love making beautiful UIs.', skills: JSON.stringify(['React', 'Tailwind', 'Framer Motion']), winnings: '1st Place HackTheNorth 2024', learnings: 'Currently learning WebGL', github: 'alice-frontend', linkedin: 'alice-frontend-in' },
  { email: 'bob@example.com', password: 'password123', name: 'Bob Backend', role: 'Backend Engineer', bio: 'Scalability is my middle name. Node, Go, Rust.', skills: JSON.stringify(['Node.js', 'PostgreSQL', 'Docker']), winnings: 'Best Use of DB at Hack MIT', learnings: 'Learning Kubernetes', github: 'bob-backend', linkedin: 'bob-backend-in' },
  { email: 'charlie@example.com', password: 'password123', name: 'Charlie AI', role: 'AI Researcher', bio: 'Training models and making agents.', skills: JSON.stringify(['Python', 'PyTorch', 'Langchain']), winnings: 'OpenAI Hackathon Winner', learnings: 'Exploring RLHF', github: 'charlie-ai', linkedin: 'charlie-ai-in', avatar: 'https://i.pravatar.cc/150?u=charlie' },
];

for (const u of users) {
  u.id = crypto.randomUUID();
}

const hackathons = [
  { id: crypto.randomUUID(), name: 'HackIndia 2026', date: 'Aug 15 - Aug 17, 2026', prize_pool: '$50,000', tech_stack_focus: 'React, Node.js, AI, Web3', team_size: '2-4', platform: 'Devfolio', registration_url: 'https://devfolio.co/hackindia2026' },
  { id: crypto.randomUUID(), name: 'Global AI Hack', date: 'Sep 10 - Sep 12, 2026', prize_pool: '$100,000', tech_stack_focus: 'Python, PyTorch, OpenAI, Next.js', team_size: '3-5', platform: 'Unstop', registration_url: 'https://unstop.com/global-ai-hack' },
  { id: crypto.randomUUID(), name: 'Web3 Buildathon', date: 'Oct 01 - Oct 03, 2026', prize_pool: '$75,000', tech_stack_focus: 'Solidity, Rust, React, Ethereum', team_size: '1-4', platform: 'Devfolio', registration_url: 'https://devfolio.co/web3-buildathon' },
];

for (const h of hackathons) {
  await db.prepare('INSERT INTO hackathons (id, name, date, prize_pool, tech_stack_focus, team_size, platform, registration_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(h.id, h.name, h.date, h.prize_pool, h.tech_stack_focus, h.team_size, h.platform, h.registration_url);
}

for (const u of users) {
  await db.prepare('INSERT INTO users (id, email, password, name, role, bio, skills, winnings, learnings, github, linkedin, avatar) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(u.id, u.email, bcrypt.hashSync(u.password, 10), u.name, u.role, u.bio, u.skills, u.winnings, u.learnings, u.github, u.linkedin, u.avatar || null);
}

const connId = crypto.randomUUID();
await db.prepare('INSERT INTO connections (id, sender_id, receiver_id, status) VALUES (?, ?, ?, ?)').run(connId, users[0].id, users[1].id, 'accepted');
await db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), users[0].id, users[1].id, 'Hey Bob! Want to team up?');
await db.prepare('INSERT INTO messages (id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), users[1].id, users[0].id, "Hi Alice! Sure, let's build something cool.");
await db.prepare('INSERT INTO connections (id, sender_id, receiver_id, status) VALUES (?, ?, ?, ?)').run(crypto.randomUUID(), users[2].id, users[0].id, 'pending');

console.log('Seeding complete! Log in with:');
users.forEach(u => console.log(`  ${u.email} / ${u.password}`));
process.exit(0);
