import initSqlJs from 'sql.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

let sqlDb;

export async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const filebuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(filebuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  sqlDb.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
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
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      description TEXT,
      link TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS connections (
      id TEXT PRIMARY KEY,
      sender_id TEXT,
      receiver_id TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT,
      receiver_id TEXT,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS team_signals (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      message TEXT,
      role_needed TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      creator_id TEXT,
      title TEXT,
      pitch TEXT,
      roles_needed TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS hackathons (
      id TEXT PRIMARY KEY,
      name TEXT,
      date TEXT,
      prize_pool TEXT,
      tech_stack_focus TEXT,
      team_size TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_hackathons (
      user_id TEXT,
      hackathon_id TEXT,
      PRIMARY KEY (user_id, hackathon_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (hackathon_id) REFERENCES hackathons(id)
    );

    CREATE TABLE IF NOT EXISTS stack_clashes (
      id TEXT PRIMARY KEY,
      connection_id TEXT,
      user_id TEXT,
      code TEXT,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (connection_id) REFERENCES connections(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reputation (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      score_component TEXT,
      points INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS debriefs (
      id TEXT PRIMARY KEY,
      hackathon_id TEXT,
      user_id TEXT,
      project_link TEXT,
      hardest_challenge TEXT,
      do_differently TEXT,
      teammate_rating INTEGER,
      teammate_tags TEXT,
      hack_again TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hackathon_id) REFERENCES hackathons(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
  saveDB();
}

function saveDB() {
  const data = sqlDb.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

// Wrapper to mimic better-sqlite3 API
const db = {
  prepare: (query) => {
    return {
      run: (...params) => {
        sqlDb.run(query, params);
        saveDB();
        return { changes: 1 };
      },
      get: (...params) => {
        const stmt = sqlDb.prepare(query);
        stmt.bind(params);
        let res = null;
        if (stmt.step()) {
          res = stmt.getAsObject();
        }
        stmt.free();
        return res;
      },
      all: (...params) => {
        const stmt = sqlDb.prepare(query);
        stmt.bind(params);
        const res = [];
        while (stmt.step()) {
          res.push(stmt.getAsObject());
        }
        stmt.free();
        return res;
      }
    };
  },
  exec: (query) => {
    sqlDb.run(query);
    saveDB();
  }
};

export default db;
