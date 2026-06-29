import dotenv from 'dotenv';
dotenv.config();

import db, { initDB } from './db.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

await initDB();
console.log('Seeding Supabase database with ultra-realistic data...');

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
await db.exec('DELETE FROM hackathons');

const users = [
  { 
    email: 'alex@example.com', password: 'password123', name: 'Alex Rivera', role: 'Full Stack Engineer', 
    bio: 'Obsessed with performance and beautiful UIs. Shipped 3 products to ProductHunt top 10. Building highly scalable systems in Next.js and Rust.', 
    skills: JSON.stringify(['React', 'Next.js', 'Rust', 'PostgreSQL', 'Framer Motion', 'Tailwind']), 
    winnings: '1st Place HackMIT 2023, ETHGlobal Finalist', learnings: 'WebGPU, Rust macros', github: 'arivera-dev', linkedin: 'alex-rivera-tech',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80', hack_score: 2150
  },
  { 
    email: 'sarah@example.com', password: 'password123', name: 'Sarah Chen', role: 'AI Researcher', 
    bio: 'Training tiny LLMs on consumer hardware. Formerly at OpenAI research internship. Love fusing generative AI with intuitive user experiences.', 
    skills: JSON.stringify(['Python', 'PyTorch', 'LangChain', 'CUDA', 'FastAPI']), 
    winnings: 'OpenAI Hackathon Winner 2024', learnings: 'Direct Preference Optimization (DPO)', github: 'schen-ai', linkedin: 'sarah-chen-ml',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80', hack_score: 1840
  },
  { 
    email: 'marcus@example.com', password: 'password123', name: 'Marcus Johnson', role: 'Backend Architect', 
    bio: 'Scaling databases and crushing latency. I build the infrastructure you do not have to think about.', 
    skills: JSON.stringify(['Go', 'Kubernetes', 'AWS', 'Redis', 'Node.js', 'GraphQL']), 
    winnings: 'Best Cloud Architecture AWS re:Invent', learnings: 'eBPF networking', github: 'marcus-backend', linkedin: 'mjohnson-infra',
    avatar: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?w=400&q=80', hack_score: 1200
  },
  { 
    email: 'elena@example.com', password: 'password123', name: 'Elena Volkov', role: 'UI/UX Engineer', 
    bio: 'Bridging the gap between Figma and code. Pixel-perfect, accessible, and delightful interfaces. I make things look expensive.', 
    skills: JSON.stringify(['Figma', 'TypeScript', 'React', 'CSS Modules', 'Three.js']), 
    winnings: 'Awwwards Site of the Day, ETH Denver Design Track', learnings: 'WebGL Shaders', github: 'elena-ui', linkedin: 'elena-volkov-design',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80', hack_score: 1550
  },
  { 
    email: 'jordan@example.com', password: 'password123', name: 'Jordan Lee', role: 'Smart Contract Dev', 
    bio: 'Web3 native. Writing gas-optimized Solidity and auditing DeFi protocols. Looking for frontend wizards to build a new DEX.', 
    skills: JSON.stringify(['Solidity', 'Foundry', 'Hardhat', 'Ethers.js', 'TypeScript']), 
    winnings: '1st Place ETHNewYork 2024', learnings: 'Zero Knowledge Proofs (ZK-SNARKs)', github: 'jordan-web3', linkedin: 'jordan-lee-eth',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80', hack_score: 1100
  },
  { 
    email: 'privalov@example.com', password: 'password123', name: 'Ivan Privalov', role: 'Systems Programmer', 
    bio: 'Kernel hacker and C++ enthusiast. I like making things go very, very fast. Not a fan of JavaScript but willing to tolerate it for hackathons.', 
    skills: JSON.stringify(['C++', 'C', 'Assembly', 'Linux Kernel', 'Rust']), 
    winnings: 'DEF CON CTF Finalist', learnings: 'Writing a custom OS', github: 'ivan-sys', linkedin: 'ivan-p',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', hack_score: 890
  },
  { 
    email: 'maya@example.com', password: 'password123', name: 'Maya Patel', role: 'Frontend Engineer', 
    bio: 'Building accessible, fluid, and highly interactive web applications. I believe the browser is the ultimate application platform.', 
    skills: JSON.stringify(['Vue.js', 'Nuxt', 'GSAP', 'Tailwind', 'Vite']), 
    winnings: 'VueConf Hackathon 1st Place', learnings: 'State Machines (XState)', github: 'maya-vue', linkedin: 'maya-patel-dev',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80', hack_score: 650
  },
  { 
    email: 'david@example.com', password: 'password123', name: 'David Kim', role: 'Mobile Dev', 
    bio: 'iOS native and React Native cross-platform developer. Shipped 5 apps with 100k+ downloads. Always looking for backend partners.', 
    skills: JSON.stringify(['Swift', 'React Native', 'Kotlin', 'Firebase', 'GraphQL']), 
    winnings: 'Apple WWDC Swift Student Challenge', learnings: 'VisionOS Development', github: 'dkim-mobile', linkedin: 'david-kim-ios',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80', hack_score: 1400
  },
  { 
    email: 'zara@example.com', password: 'password123', name: 'Zara Smith', role: 'Data Scientist', 
    bio: 'Making sense of massive datasets. Expert in predictive modeling, ETL pipelines, and finding the hidden story in raw numbers.', 
    skills: JSON.stringify(['Python', 'Pandas', 'Apache Spark', 'TensorFlow', 'SQL']), 
    winnings: 'Kaggle Grandmaster', learnings: 'Graph Neural Networks', github: 'zara-data', linkedin: 'zara-smith-ds',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80', hack_score: 2200
  },
  { 
    email: 'omar@example.com', password: 'password123', name: 'Omar Farooq', role: 'DevOps Engineer', 
    bio: 'I automate everything. If I have to do it twice, I write a script for it. Building robust CI/CD and monitoring pipelines.', 
    skills: JSON.stringify(['Docker', 'Kubernetes', 'Terraform', 'GitHub Actions', 'Prometheus']), 
    winnings: 'Hacktoberfest Top Contributor', learnings: 'ArgoCD', github: 'omar-ops', linkedin: 'omar-farooq-devops',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80', hack_score: 1350
  }
];

for (const u of users) {
  u.id = crypto.randomUUID();
}

const hackathons = [
  { id: crypto.randomUUID(), name: 'ETHGlobal San Francisco', date: 'Nov 03 - Nov 05, 2026', prize_pool: '$250,000', tech_stack_focus: 'Solidity, ZK, Web3, React', team_size: '2-5', platform: 'Devfolio', registration_url: 'https://devfolio.co/ethglobal-sf' },
  { id: crypto.randomUUID(), name: 'GenAI Buildathon', date: 'Sep 20 - Sep 22, 2026', prize_pool: '$100,000', tech_stack_focus: 'OpenAI, LangChain, Python, Next.js', team_size: '1-4', platform: 'Unstop', registration_url: 'https://unstop.com/genai-buildathon' },
  { id: crypto.randomUUID(), name: 'Global Hack Week: Cloud', date: 'Oct 10 - Oct 17, 2026', prize_pool: 'Swag & Credits', tech_stack_focus: 'AWS, GCP, Azure, Docker', team_size: '1-4', platform: 'Major League Hacking', registration_url: 'https://mlh.io' },
  { id: crypto.randomUUID(), name: 'Solana Crossroads Hackathon', date: 'Dec 01 - Dec 15, 2026', prize_pool: '$1,000,000', tech_stack_focus: 'Rust, Solana, TypeScript', team_size: '3-5', platform: 'Devfolio', registration_url: 'https://devfolio.co/solana-crossroads' }
];

for (const h of hackathons) {
  await db.prepare('INSERT INTO hackathons (id, name, date, prize_pool, tech_stack_focus, team_size, platform, registration_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(h.id, h.name, h.date, h.prize_pool, h.tech_stack_focus, h.team_size, h.platform, h.registration_url);
}

for (const u of users) {
  await db.prepare('INSERT INTO users (id, email, password, name, role, bio, skills, winnings, learnings, github, linkedin, avatar, hack_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .run(u.id, u.email, bcrypt.hashSync(u.password, 10), u.name, u.role, u.bio, u.skills, u.winnings, u.learnings, u.github, u.linkedin, u.avatar || null, u.hack_score || 0);
}

// Add some Project Ideas
const ideas = [
  { id: crypto.randomUUID(), creator_id: users[1].id, title: 'Local AI Code Reviewer', pitch: 'A CLI tool that uses local open-source LLMs to review PRs without sending code to the cloud.', roles_needed: 'Rust, Systems Programmer' },
  { id: crypto.randomUUID(), creator_id: users[4].id, title: 'Zero-Knowledge DAO Voting', pitch: 'A governance platform where votes are verified on-chain without revealing the voter\'s wallet address using ZK-SNARKs.', roles_needed: 'Frontend Dev, Cryptographer' },
  { id: crypto.randomUUID(), creator_id: users[3].id, title: 'Glassmorphism Component Library', pitch: 'A premium React component library focusing entirely on highly animated glassmorphic UIs.', roles_needed: 'React Dev, Accessibility Expert' }
];

for (const idea of ideas) {
  await db.prepare('INSERT INTO ideas (id, creator_id, title, pitch, roles_needed) VALUES (?, ?, ?, ?, ?)').run(idea.id, idea.creator_id, idea.title, idea.pitch, idea.roles_needed);
}

// Add some Active Signals
const signals = [
  { id: crypto.randomUUID(), user_id: users[2].id, message: 'Need a frontend wizard for a GenAI hackathon this weekend! Backend is mostly done.', role_needed: 'Frontend', created_at: new Date().toISOString() },
  { id: crypto.randomUUID(), user_id: users[7].id, message: 'Looking for someone who knows Firebase rules inside out for a quick collab.', role_needed: 'Backend', created_at: new Date().toISOString() }
];

for (const sig of signals) {
  await db.prepare('INSERT INTO team_signals (id, user_id, message, role_needed, created_at) VALUES (?, ?, ?, ?, ?)').run(sig.id, sig.user_id, sig.message, sig.role_needed, sig.created_at);
}

console.log('Seeding complete! High-fidelity data injected.');
process.exit(0);
