import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { initDB } from './db.js';
import bcrypt from 'bcryptjs';

import User from './models/User.js';
import Project from './models/Project.js';
import Connection from './models/Connection.js';
import Message from './models/Message.js';
import TeamSignal from './models/TeamSignal.js';
import Idea from './models/Idea.js';
import Hackathon from './models/Hackathon.js';
import UserHackathon from './models/UserHackathon.js';
import StackClash from './models/StackClash.js';
import Reputation from './models/Reputation.js';
import Debrief from './models/Debrief.js';

await initDB();
console.log('Seeding MongoDB database with ultra-realistic data...');

await Message.deleteMany({});
await StackClash.deleteMany({});
await Connection.deleteMany({});
await Project.deleteMany({});
await TeamSignal.deleteMany({});
await Idea.deleteMany({});
await UserHackathon.deleteMany({});
await Debrief.deleteMany({});
await Reputation.deleteMany({});
await User.deleteMany({});
await Hackathon.deleteMany({});

const usersData = [
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

const createdUsers = [];
for (const u of usersData) {
  const hash = bcrypt.hashSync(u.password, 10);
  const doc = await User.create({
    email: u.email,
    password: hash,
    name: u.name,
    role: u.role,
    bio: u.bio,
    skills: u.skills,
    winnings: u.winnings,
    learnings: u.learnings,
    github: u.github,
    linkedin: u.linkedin,
    avatar: u.avatar,
    hack_score: u.hack_score,
  });
  createdUsers.push(doc);
}

const hackathonsData = [
  { name: 'ETHGlobal San Francisco', date: 'Nov 03 - Nov 05, 2026', prize_pool: '$250,000', tech_stack_focus: 'Solidity, ZK, Web3, React', team_size: '2-5', platform: 'Devfolio', registration_url: 'https://devfolio.co/ethglobal-sf' },
  { name: 'GenAI Buildathon', date: 'Sep 20 - Sep 22, 2026', prize_pool: '$100,000', tech_stack_focus: 'OpenAI, LangChain, Python, Next.js', team_size: '1-4', platform: 'Unstop', registration_url: 'https://unstop.com/genai-buildathon' },
  { name: 'Global Hack Week: Cloud', date: 'Oct 10 - Oct 17, 2026', prize_pool: 'Swag & Credits', tech_stack_focus: 'AWS, GCP, Azure, Docker', team_size: '1-4', platform: 'Major League Hacking', registration_url: 'https://mlh.io' },
  { name: 'Solana Crossroads Hackathon', date: 'Dec 01 - Dec 15, 2026', prize_pool: '$1,000,000', tech_stack_focus: 'Rust, Solana, TypeScript', team_size: '3-5', platform: 'Devfolio', registration_url: 'https://devfolio.co/solana-crossroads' }
];

await Hackathon.insertMany(hackathonsData);

const ideasData = [
  { creator_id: createdUsers[1]._id, title: 'Local AI Code Reviewer', pitch: 'A CLI tool that uses local open-source LLMs to review PRs without sending code to the cloud.', roles_needed: 'Rust, Systems Programmer' },
  { creator_id: createdUsers[4]._id, title: 'Zero-Knowledge DAO Voting', pitch: 'A governance platform where votes are verified on-chain without revealing the voter\'s wallet address using ZK-SNARKs.', roles_needed: 'Frontend Dev, Cryptographer' },
  { creator_id: createdUsers[3]._id, title: 'Glassmorphism Component Library', pitch: 'A premium React component library focusing entirely on highly animated glassmorphic UIs.', roles_needed: 'React Dev, Accessibility Expert' }
];

await Idea.insertMany(ideasData);

const signalsData = [
  { user_id: createdUsers[2]._id, message: 'Need a frontend wizard for a GenAI hackathon this weekend! Backend is mostly done.', role_needed: 'Frontend', expires_at: new Date(Date.now() + 86400000) },
  { user_id: createdUsers[7]._id, message: 'Looking for someone who knows Firebase rules inside out for a quick collab.', role_needed: 'Backend', expires_at: new Date(Date.now() + 86400000) }
];

await TeamSignal.insertMany(signalsData);

console.log('Seeding complete! High-fidelity data injected.');
process.exit(0);
