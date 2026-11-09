import 'dotenv/config';
import fs from 'fs';
import mysql from 'mysql2/promise';

const file = process.argv[2] || 'sql/03_verify.sql';

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  multipleStatements: true,
});

try {
  const sql = fs.readFileSync(file, 'utf8');
  const [results] = await db.query(sql); // one entry per statement

  // Pull the "-- comment" line above each statement to use as its label
  const labels = sql
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => (chunk.split('\n').find((l) => l.startsWith('--')) || '-- query').replace(/^--\s*/, ''));

  results.forEach((rows, i) => {
    console.log(`\n[${i + 1}] ${labels[i] ?? ''}`);
    if (Array.isArray(rows) && rows.length === 0) console.log('  (0 rows)');
    else console.table(rows);
  });
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}