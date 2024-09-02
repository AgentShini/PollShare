const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;

// SQLite database setup
const db = new sqlite3.Database(':memory:'); // In-memory database for simplicity; replace ':memory:' with a file path for persistence

db.serialize(() => {
    db.run(`CREATE TABLE polls (
        id TEXT PRIMARY KEY,
        question TEXT,
        duration INTEGER
    )`);
    
    db.run(`CREATE TABLE options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        poll_id TEXT,
        text TEXT,
        votes INTEGER DEFAULT 0,
        FOREIGN KEY (poll_id) REFERENCES polls(id)
    )`);
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// REST API to create a poll
app.post('/api/polls', (req, res) => {
    const pollId = Date.now().toString();
    const { question, options, duration } = req.body;
    
    db.run(`INSERT INTO polls (id, question, duration) VALUES (?, ?, ?)`, [pollId, question, duration]);
    
    options.forEach((option) => {
        db.run(`INSERT INTO options (poll_id, text) VALUES (?, ?)`, [pollId, option]);
    });

    res.json({ id: pollId, question, options: options.map(text => ({ text, votes: 0 })), duration });
});

// REST API to get a poll by ID
app.get('/api/polls/:id', (req, res) => {
    const pollId = req.params.id;
    
    db.get(`SELECT * FROM polls WHERE id = ?`, [pollId], (err, poll) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (!poll) return res.status(404).json({ message: 'Poll not found' });

        db.all(`SELECT * FROM options WHERE poll_id = ?`, [pollId], (err, options) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            res.json({ ...poll, options });
        });
    });
});

// REST API to vote on a poll
app.put('/api/polls/vote/:id', (req, res) => {
    const pollId = req.params.id;
    const { selectedOption } = req.body;

    db.run(`UPDATE options SET votes = votes + 1 WHERE poll_id = ? AND id = ?`, [pollId, selectedOption], function (err) {
        if (err) return res.status(500).json({ message: 'Database error' });

        db.get(`SELECT * FROM options WHERE id = ?`, [selectedOption], (err, option) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            broadcast({ type: 'voteUpdated', pollId, option });
            res.json(option);
        });
    });
});

// Set up WebSocket for real-time updates
const server = app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

