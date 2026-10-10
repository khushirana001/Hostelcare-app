const express = require('express');
const { loadDB, saveDB, genId } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Simple, transparent keyword-based priority flagging.
// This never diagnoses a condition - it only helps route the alert faster; a human always reviews it.
function flagPriority(description = '') {
  const text = description.toLowerCase();
  const high = ["can't stand", 'unconscious', 'bleeding', 'chest pain', "can't breathe", 'severe'];
  if (high.some((kw) => text.includes(kw))) return 'High';
  return 'Medium';
}

// POST /api/emergency - student presses SOS
router.post('/', requireRole('student'), (req, res) => {
  const { type = 'General', description = '', coordinates = null } = req.body || {};
  const db = loadDB();
  const profile = db.profiles.find((p) => p.userId === req.user.id);
  if (!profile) return res.status(404).json({ error: 'Complete your profile before reporting an emergency.' });

  const emergency = {
    id: genId('sos'),
    studentId: req.user.id,
    studentName: profile.name,
    type,
    description,
    priority: flagPriority(description),
    humanReviewRequired: true,
    status: 'reported',
    location: { hostelName: profile.hostelName, roomNo: profile.roomNo, floor: profile.floor },
    coordinates: coordinates || { lat: 28.5450, lng: 77.1926 },
    timeline: [{ status: 'reported', at: new Date().toISOString() }],
    createdAt: new Date().toISOString()
  };
  db.emergencies.push(emergency);
  saveDB(db);
  res.status(201).json({ emergency });
});

// GET /api/emergency - staff view of all emergencies (optionally filter by status)
router.get('/', requireRole('warden', 'doctor', 'admin'), (req, res) => {
  const db = loadDB();
  const { status } = req.query;
  let list = db.emergencies;
  if (status) list = list.filter((e) => e.status === status);
  res.json({ emergencies: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/emergency/:id - a student can view their own; staff can view any
router.get('/:id', (req, res) => {
  const db = loadDB();
  const emergency = db.emergencies.find((e) => e.id === req.params.id);
  if (!emergency) return res.status(404).json({ error: 'Emergency not found.' });
  if (req.user.role === 'student' && emergency.studentId !== req.user.id) {
    return res.status(403).json({ error: 'You can only view your own emergency reports.' });
  }
  res.json({ emergency });
});

// PATCH /api/emergency/:id - warden/doctor update status
// body: { status: 'responder_assigned' | 'on_the_way' | 'reached_student' | 'hospital_required' | 'resolved' }
router.patch('/:id', requireRole('warden', 'doctor'), (req, res) => {
  const { status } = req.body || {};
  const allowed = ['responder_assigned', 'on_the_way', 'reached_student', 'hospital_required', 'ambulance_dispatched', 'resolved'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
  }
  const db = loadDB();
  const emergency = db.emergencies.find((e) => e.id === req.params.id);
  if (!emergency) return res.status(404).json({ error: 'Emergency not found.' });

  emergency.status = status;
  emergency.timeline.push({ status, at: new Date().toISOString(), by: req.user.role });
  saveDB(db);
  res.json({ emergency });
});

module.exports = router;
