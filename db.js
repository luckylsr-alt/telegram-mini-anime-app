// Super simple JSON-file "database". Good enough for a small personal app.
// Swap this file out later for SQLite/Postgres if you outgrow it — nothing
// else in the project needs to change since server.js and bot.js only call
// readDB() / writeDB().

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'db.json');

function ensureDB() {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ videos: [] }, null, 2));
  }
}

function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

module.exports = { readDB, writeDB };
