const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { loadDB, saveDB, genId } = require('../db');
const { ROLES, pickProfileFields } = require('../roles');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
// body: { email, password, role, profile: { ...role-specific fields } }
router.post('/register', (req, res) => {
  const { email, password, role, profile } = req.body || {};

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'email, password and role are required.' });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(', ')}` });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const db = loadDB();
  const exists = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

  const user = {
    id: genId('user'),
    email: email.toLowerCase(),
    passwordHash: bcrypt.hashSync(password, 10),
    role
  };
  db.users.push(user);

  const profileRecord = { userId: user.id, role, ...pickProfileFields(role, profile) };
  db.profiles.push(profileRecord);

  saveDB(db);

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
    profile: profileRecord
  });
});

// POST /api/auth/login
// body: { email, password }
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required.' });

  const db = loadDB();
  const user = db.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const profile = db.profiles.find((p) => p.userId === user.id) || null;
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role }, profile });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const db = loadDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  const profile = db.profiles.find((p) => p.userId === user.id) || null;
  res.json({ user: { id: user.id, email: user.email, role: user.role }, profile });
});

module.exports = router;
