const express = require('express');
const { loadDB, saveDB, genId } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const STATUS_PIPELINE = [
  'submitted',
  'documents_verified',
  'pre_authorization',
  'under_review',
  'approved',
  'rejected',
  'settled',
  'closed'
];

const REQUIRED_DOCUMENTS = ['Student ID', 'Policy details', 'Hospital admission', 'Medical report', 'Final bill'];

// POST /api/claims - student submits a new claim
// body: { hospitalId, incidentId (optional), description }
router.post('/', requireRole('student'), (req, res) => {
  const { hospitalId, incidentId = null, description = '' } = req.body || {};
  if (!hospitalId) return res.status(400).json({ error: 'hospitalId is required.' });

  const db = loadDB();
  const hospital = db.hospitals.find((h) => h.id === hospitalId);
  if (!hospital) return res.status(404).json({ error: 'Hospital not found.' });

  const claim = {
    id: genId('clm'),
    studentId: req.user.id,
    hospitalId,
    hospitalName: hospital.name,
    incidentId,
    description,
    status: 'submitted',
    documents: REQUIRED_DOCUMENTS.map((type) => ({ type, uploaded: false })),
    timeline: [{ status: 'submitted', at: new Date().toISOString() }],
    createdAt: new Date().toISOString()
  };
  db.claims.push(claim);
  saveDB(db);
  res.status(201).json({ claim });
});

// GET /api/claims - student: own claims. staff: all claims (optionally ?status=)
router.get('/', (req, res) => {
  const db = loadDB();
  let list = db.claims;
  if (req.user.role === 'student') {
    list = list.filter((c) => c.studentId === req.user.id);
  }
  if (req.query.status) list = list.filter((c) => c.status === req.query.status);
  res.json({ claims: list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) });
});

// GET /api/claims/:id
router.get('/:id', (req, res) => {
  const db = loadDB();
  const claim = db.claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });
  if (req.user.role === 'student' && claim.studentId !== req.user.id) {
    return res.status(403).json({ error: 'You can only view your own claims.' });
  }
  res.json({ claim });
});

// POST /api/claims/:id/documents - student marks a required document as uploaded
// body: { type }
router.post('/:id/documents', requireRole('student'), (req, res) => {
  const { type } = req.body || {};
  const db = loadDB();
  const claim = db.claims.find((c) => c.id === req.params.id && c.studentId === req.user.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  const doc = claim.documents.find((d) => d.type === type);
  if (!doc) return res.status(400).json({ error: `Unknown document type: ${type}` });
  doc.uploaded = true;
  doc.uploadedAt = new Date().toISOString();
  saveDB(db);
  res.json({ claim });
});

// PATCH /api/claims/:id/status - admin/doctor moves the claim along the pipeline
// body: { status }
router.patch('/:id/status', requireRole('admin', 'doctor'), (req, res) => {
  const { status } = req.body || {};
  if (!STATUS_PIPELINE.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUS_PIPELINE.join(', ')}` });
  }
  const db = loadDB();
  const claim = db.claims.find((c) => c.id === req.params.id);
  if (!claim) return res.status(404).json({ error: 'Claim not found.' });

  claim.status = status;
  claim.timeline.push({ status, at: new Date().toISOString(), by: req.user.role });
  saveDB(db);
  res.json({ claim });
});

module.exports = router;
