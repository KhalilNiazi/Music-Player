// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// DB setup
const db = new sqlite3.Database('./musicify.db');

// Create tables
db.run(`CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  path TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS playlist_songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER,
  name TEXT,
  path TEXT,
  FOREIGN KEY(playlist_id) REFERENCES playlists(id)
)`);

// Add to Favorites
app.post('/favorites', (req, res) => {
  const { name, path } = req.body;
  db.run("INSERT INTO favorites (name, path) VALUES (?, ?)", [name, path], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// Get all Favorites
app.get('/favorites', (req, res) => {
  db.all("SELECT * FROM favorites", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get Playlists
app.get('/playlists', (req, res) => {
  db.all("SELECT * FROM playlists", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create Playlist
app.post('/playlists', (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO playlists (name) VALUES (?)", [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// Add Song to Playlist
app.post('/playlist_songs', (req, res) => {
  const { playlist_id, name, path } = req.body;
  db.run("INSERT INTO playlist_songs (playlist_id, name, path) VALUES (?, ?, ?)", [playlist_id, name, path], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// Get Songs in Playlist
app.get('/playlist_songs/:playlist_id', (req, res) => {
  const id = req.params.playlist_id;
  db.all("SELECT * FROM playlist_songs WHERE playlist_id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
