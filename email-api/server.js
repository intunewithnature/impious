import express from 'express';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

const app = express();
app.use(express.json());

const DB_PATH = process.env.DB_FILE || '/data/emails.db';

const db = new Database(DB_PATH, (err) => {
  if (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, () => console.log('Email API live – SQLite @ ' + DB_PATH));
});

app.post('/enlist', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 320) {
    return res.status(400).json({ success: false, error: 'Invalid email' });
  }

  db.run(
    `INSERT OR IGNORE INTO emails (email) VALUES (?)`,
    [email.trim().toLowerCase()],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

app.get('/healthz', (_req, res) => res.send('ok'));

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`Enlist API listening on port ${port}`);
});
