const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../lionheart.db');

// Create database connection
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

console.log(`🦁 Lionheart database connected: ${dbPath}`);

module.exports = db;
