import 'dotenv/config';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'vitaltrack.db');

export async function getDB() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  await db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

async function migrate() {
  const db = await getDB();
  const migPath = path.join(__dirname, '..', 'migrations', '001_schema.sql');
  const sql = fs.readFileSync(migPath, 'utf-8');
  await db.exec(sql);
  console.log('Migration complete.');
  await db.close();
}

if (process.argv[2] === 'migrate') {
  migrate().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
