const express = require('express');
const { loadDB, saveDB } = require('../db');
const { pickProfileFields } = require('../roles');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/profile - own profile
router.get('/', (req, res) => {
  const db = loadDB();
  const profile = db.profiles.find((p) => p.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: 'Profile not found.' });
  res.json({ profile });
});

// PUT /api/profile - update own profile (only fields valid for the user's role are kept)
router.put('/', (req, res) => {
  const db = loadDB();
  const idx = db.profiles.findIndex((p) => p.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Profile not found.' });

  const updated = { ...db.profiles[idx], ...pickProfileFields(req.user.role, req.body) };
  db.profiles[idx] = updated;
  saveDB(db);
  res.json({ profile: updated });
});

// GET /api/profile/directory?role=student - staff lookup of other users, e.g. wardens finding a student
router.get('/directory', requireRole('admin', 'warden', 'teacher', 'doctor'), (req, res) => {
  const db = loadDB();
  const { role, hostelName } = req.query;
  let results = db.profiles;
  if (role) results = results.filter((p) => p.role === role);
  if (hostelName) results = results.filter((p) => (p.hostelName || '').toLowerCase() === String(hostelName).toLowerCase());
  res.json({ profiles: results });
});

module.exports = router;
