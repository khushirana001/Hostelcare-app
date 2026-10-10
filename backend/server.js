require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const emergencyRoutes = require('./routes/emergency');
const insuranceRoutes = require('./routes/insurance');
const claimsRoutes = require('./routes/claims');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend directory
const frontendDir = path.join(__dirname, '../frontend');
app.use(express.static(frontendDir));

// API Endpoints
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'hostelcare-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/claims', claimsRoutes);

// Fallback route for SPA / frontend entry
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found.' });
  }
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`HostelCare API running on http://localhost:${PORT}`));
