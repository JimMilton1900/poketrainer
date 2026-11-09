import 'dotenv/config';
import fs from 'fs';
import mysql from 'mysql2/promise';

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node seed/runSql.js file1.sql file2.sql ...');
  process.exit(1);
}

 

const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
          ca: fs.readFileSync(
              new URL("../src/config/ca.pem", import.meta.url)
          )
        },
  multipleStatements: true, // needed to run a whole .sql file at once
});

try {
  for (const f of files) {
    console.log(`Running ${f} ...`);
    await db.query(fs.readFileSync(f, 'utf8'));
  }
  const [rows] = await db.query('SHOW TABLES');
  console.log(`${rows.length} tables:`, rows.map((r) => Object.values(r)[0]).join(', '));
} catch (e) {
  console.error('FAILED:', e.message);
  process.exitCode = 1;
} finally {
  await db.end();
}