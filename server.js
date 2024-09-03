const express = require('express');
const cors = require('cors');
const path = require('path');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 5000;

// SQLite database setup
const db = new sqlite3.Database(':memory:'); // Use ':memory:' for an in-memory database

db.serialize(() => {
    db.run(`CREATE TABLE polls (
        id TEXT PRIMARY KEY,
        question TEXT,
        duration INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
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

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Explicitly serve index.html for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// REST API to create a poll
app.post('/api/polls', (req, res) => {
    const pollId = Date.now().toString();
    const { question, options, duration } = req.body;
    
    db.run(`INSERT INTO polls (id, question, duration) VALUES (?, ?, ?)`, [pollId, question, duration], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to create poll' });
        }

        options.forEach((option) => {
            db.run(`INSERT INTO options (poll_id, text) VALUES (?, ?)`, [pollId, option]);
        });

        res.json({ id: pollId, question, options: options.map(text => ({ text, votes: 0 })), duration });
    });
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

        db.all(`SELECT * FROM options WHERE poll_id = ?`, [pollId], (err, options) => {
            if (err) return res.status(500).json({ message: 'Database error' });

            db.get(`SELECT * FROM polls WHERE id = ?`, [pollId], (err, poll) => {
                if (err) return res.status(500).json({ message: 'Database error' });

                const updatedPoll = { ...poll, options };
                broadcast({ type: 'voteUpdated', poll: updatedPoll });
                res.json(updatedPoll);
            });
        });
    });
});

// Start the server and WebSocket server
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

