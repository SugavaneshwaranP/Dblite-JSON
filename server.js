const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('survey.db', (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database.");
  }
});

app.get('/users', (req, res) => {
  let page = parseInt(req.query.page) || 1;
  let limit = parseInt(req.query.limit) || 20;
  let offset = (page - 1) * limit;

  db.all("SELECT * FROM users LIMIT ? OFFSET ?", [limit, offset], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/users/:id', (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM users WHERE user_id = ?", [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: "User not found" });
    res.json(row);
  });
});

// Add this endpoint to your existing server code
app.post('/api/plfs/query', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  // Basic validation to prevent malicious queries
  if (query.toLowerCase().includes('drop') || 
      query.toLowerCase().includes('delete') || 
      query.toLowerCase().includes('update') ||
      query.toLowerCase().includes('insert')) {
    return res.status(403).json({ error: "Only SELECT queries are allowed" });
  }

  console.log("Executing query:", query);
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("Query error:", err);
      return res.status(400).json({ error: err.message });
    }
    res.json(rows);
  });
});
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
