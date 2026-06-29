import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let pool;

function toPgParams(query) {
  let i = 0;
  return query.replace(/\?/g, () => `$${++i}`);
}

export async function initDB() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'Missing DATABASE_URL. Get it from Supabase → Project Settings → Database → Connection string (URI).'
    );
  }

  pool = new pg.Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL !== 'false'
      ? { rejectUnauthorized: false }
      : undefined,
    max: 10,
  });

  await pool.query('SELECT 1');

  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    await pool.query(schema);
  }

  console.log('Connected to Supabase PostgreSQL');
}

const db = {
  prepare(query) {
    const pgQuery = toPgParams(query);
    return {
      run: async (...params) => {
        await pool.query(pgQuery, params);
        return { changes: 1 };
      },
      get: async (...params) => {
        const res = await pool.query(pgQuery, params);
        return res.rows[0] ?? null;
      },
      all: async (...params) => {
        const res = await pool.query(pgQuery, params);
        return res.rows;
      },
    };
  },
  exec: async (query) => {
    await pool.query(query);
  },
};

export default db;
