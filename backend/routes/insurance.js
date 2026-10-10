const express = require('express');
const { loadDB, saveDB, genId } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/insurance/policy - a student's own policy
router.get('/policy', requireRole('student'), (req, res) => {
  const db = loadDB();
  const policy = db.policies.find((p) => p.studentId === req.user.id);
  if (!policy) return res.status(404).json({ error: 'No policy found for your account yet.' });
  res.json({ policy });
});

// POST /api/insurance/policy - admin creates/updates a student's policy
// body: { studentId, provider, memberId, validFrom, validUntil }
router.post('/policy', requireRole('admin'), (req, res) => {
  const { studentId, provider, memberId, validFrom, validUntil } = req.body || {};
  if (!studentId || !provider || !memberId) {
    return res.status(400).json({ error: 'studentId, provider and memberId are required.' });
  }
  const db = loadDB();
  const student = db.profiles.find((p) => p.userId === studentId && p.role === 'student');
  if (!student) return res.status(404).json({ error: 'No student found with that id.' });

  let policy = db.policies.find((p) => p.studentId === studentId);
  if (policy) {
    Object.assign(policy, { provider, memberId, validFrom, validUntil, status: 'active' });
  } else {
    policy = { id: genId('pol'), studentId, provider, memberId, validFrom, validUntil, status: 'active' };
    db.policies.push(policy);
  }
  saveDB(db);
  res.status(201).json({ policy });
});

// GET /api/insurance/overview - admin dashboard aggregates
router.get('/overview', requireRole('admin'), (req, res) => {
  const db = loadDB();
  const studentCount = db.profiles.filter((p) => p.role === 'student').length;
  const activePolicies = db.policies.filter((p) => p.status === 'active').length;
  const pendingEnrollment = Math.max(studentCount - db.policies.length, 0);
  const thisYear = new Date().getFullYear();
  const claimsThisYear = db.claims.filter((c) => new Date(c.createdAt).getFullYear() === thisYear).length;
  const pendingClaims = db.claims.filter((c) => !['settled', 'closed', 'rejected'].includes(c.status)).length;
  const settledClaims = db.claims.filter((c) => c.status === 'settled' || c.status === 'closed').length;

  res.json({
    studentsCovered: studentCount,
    activePolicies,
    pendingEnrollment,
    claimsThisYear,
    pendingClaims,
    settledClaims
  });
});

// GET /api/insurance/hospitals - network hospital list (any authenticated role)
router.get('/hospitals', (req, res) => {
  const db = loadDB();
  res.json({ hospitals: db.hospitals });
});

// POST /api/insurance/hospitals - admin adds a hospital to the network
router.post('/hospitals', requireRole('admin'), (req, res) => {
  const { name, distanceKm = null, network = true, emergencyService = true } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const db = loadDB();
  const hospital = { id: genId('hos'), name, distanceKm, network, emergencyService };
  db.hospitals.push(hospital);
  saveDB(db);
  res.status(201).json({ hospital });
});

module.exports = router;
