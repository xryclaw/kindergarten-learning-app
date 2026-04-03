import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db = null;

function runMigrations(database) {
  const migrationsDir = join(__dirname, 'migrations');
  let files = [];
  try {
    files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Failed to read migrations directory:', err);
      throw err;
    }
    // Directory does not exist, skip
    return;
  }

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    database.exec(sql);
    console.log(`Migration applied: ${file}`);
  }
}

export function initDatabase(dbPath) {
  if (db) {
    return db;
  }

  // Create database connection
  db = new Database(dbPath, { verbose: console.log });

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Initialize schema
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  db.exec(schema);

  // Run migrations
  runMigrations(db);

  console.log('Database initialized successfully');

  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
