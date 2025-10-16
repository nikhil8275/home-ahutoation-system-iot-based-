// --- 1. IMPORT NECESSARY PACKAGES ---
const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const session = require('express-session');
// Important: Use node-fetch version 2 for CommonJS syntax. Install with: npm install node-fetch@2
const fetch = require('node-fetch');

// --- 2. INITIALIZE APP & CONSTANTS ---
const app = express();
const PORT = 5000;
const saltRounds = 10;
const path = require('path');

// --- 3. DATABASE CONNECTION & ESP32 IP ---
// --- FINAL CORRECTION: UPDATE THE IP ADDRESS ---
const ESP32_IP_ADDRESS = "https://192.168.1.101"; // Your ESP32's new, correct IP Address

const db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'home_auto'
});

db.connect(err => {
    if (err) { console.error('❌ Database connection failed:', err); process.exit(1); }
    console.log('✅ Successfully connected to MySQL database.');
});

// --- 4. MIDDLEWARE SETUP ---
app.use(express.static('public'));
app.use(express.json());
app.use(session({
    secret: 'a-very-long-and-random-string-for-security',
    resave: false, saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// --- 5. API ROUTES ---
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/login.html'); 
};

app.get('/', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- AUTHENTICATION & LOGGING ROUTES ---
// ... (Your existing /register, /login, /logout, /session, and /logs routes are perfect) ...
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: 'Username and password are required.' }); }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') { return res.status(409).json({ message: 'This username is already taken.' }); }
                return res.status(500).json({ message: 'Database error.' });
            }
            req.session.userId = result.insertId;
            req.session.username = username;
            res.status(201).json({ message: 'Registration successful', username: username });
        });
    } catch (error) { res.status(500).json({ message: 'Server error.' }); }
});
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) { return res.status(400).json({ message: 'Username and password are required.' }); }
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err || results.length === 0) { return res.status(401).json({ message: 'Invalid credentials.' }); }
        const user = results[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            req.session.userId = user.id;
            req.session.username = user.username;
            res.redirect('/');
        } else {
            res.status(401).json({ message: 'Invalid username or password.' });
        }
    });
});
app.post('/logout', (req, res) => {
    req.session.destroy(() => { res.json({ message: 'Logout successful' }); });
});
app.get('/session', (req, res) => {
    if (req.session.userId) { res.json({ loggedIn: true, username: req.session.username }); }
    else { res.json({ loggedIn: false }); }
});
app.get('/logs', isAuthenticated, (req, res) => {
    const sql = `SELECT l.device_name, l.action, l.timestamp, u.username FROM logs l JOIN users u ON l.user_id = u.id ORDER BY l.timestamp DESC LIMIT 20`;
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Could not fetch logs.' });
        }
        res.json(results);
    });
});

// --- FINAL HARDWARE CONTROL ROUTE ---
app.post('/turn/:device/:action', isAuthenticated, async (req, res) => {
    const { device, action } = req.params;       // The technical name, e.g., "bulb1"
    const { deviceName } = req.body;           // The friendly name, e.g., "Living Room Light"
    const userId = req.session.userId;

    if (!device || (action !== 'on' && action !== 'off')) {
        return res.status(400).json({ message: 'Invalid device or action.' });
    }

    try {
        const espUrl = `${ESP32_IP_ADDRESS}/${device}/${action}`;
        console.log(`Relaying command to ESP32: ${espUrl}`);
        
        const espResponse = await fetch(espUrl);
        if (!espResponse.ok) {
            throw new Error('ESP32 did not respond correctly. Check if it is powered on and connected to Wi-Fi.');
        }
        
        const responseText = await espResponse.text();
        console.log(`   Response from ESP32: ${responseText}`);
        
        const logSql = 'INSERT INTO logs (user_id, device_name, action) VALUES (?, ?, ?)';
        db.query(logSql, [userId, deviceName, action], (logErr, logResult) => {
            if (logErr) {
                console.error('   ⚠️  Failed to write to logs table:', logErr);
            } else {
                console.log(`   ✅ Action logged to database. Log ID: ${logResult.insertId}`);
            }
        });

        res.json({ message: `Command for ${device} sent successfully.` });

    } catch (error) {
        console.error('   ❌ FAILED to send command to ESP32:', error.message);
        res.status(500).json({ message: 'Failed to communicate with the hardware device.' });
    }
});

// --- 6. START THE SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server is live and listening at http://localhost:${PORT}`);
});

