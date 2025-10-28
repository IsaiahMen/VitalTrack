import fs from 'fs/promises';
import 'dotenv/config';
import { query } from '../src/db.js';

async function migrate() {
  const sql = await fs.readFile('migrations/postgres_schema.sql', 'utf8');
  await query(sql);
  console.log('✅ Postgres schema applied');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
