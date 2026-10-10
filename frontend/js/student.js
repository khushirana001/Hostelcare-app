let currentTab = 'home';
let user = null;
let profile = null;
let studentCoords = { lat: 28.5450, lng: 77.1926 }; // Campus default coordinates
let studentMapInstance = null;
let studentMarker = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth('student')) return;

  user = getCurrentUser();
  profile = getCurrentProfile() || {};

  document.getElementById('userName').textContent = profile.name || user.email;
  document.getElementById('userSub').textContent = `${profile.hostelName || 'Hostel B'} · Room ${profile.roomNo || '214'}`;

  renderTab('home');
});

function switchStudentTab(tab) {
  currentTab = tab;
  ['Home', 'Health', 'Insurance', 'Claims'].forEach(t => {
    const key = t.toLowerCase();
    const isAct = key === tab;
    const rEl = document.getElementById(`nav${t}`);
    const mEl = document.getElementById(`mNav${t}`);
    if (rEl) rEl.classList.toggle('active', isAct);
    if (mEl) mEl.classList.toggle('active', isAct);
  });

  renderTab(tab);
}

function renderTab(tab) {
  const root = document.getElementById('contentRoot');
  const titles = { home: 'Home', health: 'Health Profile', insurance: 'Insurance Policy', claims: 'Claims Progress' };
  document.getElementById('pageTitle').textContent = titles[tab] || 'Dashboard';

  if (tab === 'home') {
    root.innerHTML = `
      <div class="sos-card">
        <button class="sos-btn" onclick="triggerStudentSOS(this)">SEND<br>SOS</button>
        <div class="sos-copy">
          <strong>In an emergency, press SOS</strong>
          <span>Warden, medical team, and security are alerted instantly with your room location and live GPS coordinates.</span>
        </div>
      </div>

      <!-- LIVE LOCATION TRACKING MAP CARD -->
      <div class="card card-accent-top">
        <div class="map-head-row">
          <div>
            <h2 style="font-size:1.08rem;font-weight:800;color:var(--navy);margin-bottom:2px">📍 Live Campus Map & GPS Tracking</h2>
            <span style="font-size:0.82rem;color:var(--muted)">Auto-routes campus emergency responders to your exact coordinates</span>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <span class="gps-badge">
              <span class="pulsing-dot"></span>
              <span id="gpsStatusText">GPS: 28.5450° N, 77.1926° E</span>
            </span>
            <button class="btn-sm" onclick="detectStudentGPS()">📍 Detect My Location</button>
          </div>
        </div>
        <div id="studentMap" class="map-canvas"></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>Insurance Status</h2>
          <span class="status-pill active">Active</span>
        </div>
        <div class="kv-grid">
          <div class="kv"><span class="label">Member ID</span><span class="value">HC123456</span></div>
          <div class="kv"><span class="label">Valid Until</span><span class="value">31 Jul 2027</span></div>
        </div>
        <div class="btn-row">
          <button class="btn" onclick="openCoverageModal()">View Coverage</button>
          <button class="btn primary" onclick="switchStudentTab('claims')">Track Claim</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <h2>How are you feeling today?</h2>
        </div>
        <div class="checkin-row">
          <button onclick="submitCheckin(this, 'Better')">🙂 Better</button>
          <button onclick="submitCheckin(this, 'Still Unwell')">😐 Still Unwell</button>
          <button onclick="submitCheckin(this, 'Need Help')">🚨 Need Help</button>
        </div>
      </div>
    `;

    setTimeout(initStudentMap, 200);

  } else if (tab === 'health') {
    root.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>Basic Health Information</h2></div>
        <div class="rows">
          <div class="row-item"><span>Blood Group</span><span>O+</span></div>
          <div class="row-item"><span>Known Allergies</span><span>Penicillin</span></div>
          <div class="row-item"><span>Ongoing Medication</span><span>None reported</span></div>
          <div class="row-item"><span>Emergency Contact</span><span>Mother · +91 98765 43210</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Recent Medical Incidents</h2></div>
        <div class="rows">
          <div class="row-item"><span>14 Aug 2026 — Minor sprain</span><span style="color:var(--green)">Resolved</span></div>
          <div class="row-item"><span>02 Mar 2026 — Fever check</span><span style="color:var(--green)">Resolved</span></div>
        </div>
      </div>
    `;
  } else if (tab === 'insurance') {
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>Policy Details</h2>
          <span class="status-pill active">Active</span>
        </div>
        <div class="kv-grid">
          <div class="kv"><span class="label">Provider</span><span class="value">CampusCare TPA</span></div>
          <div class="kv"><span class="label">Member ID</span><span class="value">HC123456</span></div>
          <div class="kv"><span class="label">Valid From</span><span class="value">01 Aug 2026</span></div>
          <div class="kv"><span class="label">Valid Until</span><span class="value">31 Jul 2027</span></div>
        </div>
        <div class="btn-row">
          <button class="btn" onclick="openCoverageModal()">Download Policy</button>
          <button class="btn primary" onclick="openCardModal()">Digital Member Card</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Network Hospitals Nearby</h2></div>
        <div class="rows">
          <div class="row-item"><span>City General Hospital · 1.2 km</span><span style="color:var(--green)">In Network</span></div>
          <div class="row-item"><span>St. Mary's Care · 3.8 km</span><span style="color:var(--muted)">Out of Network</span></div>
        </div>
      </div>
    `;
  } else if (tab === 'claims') {
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>Active Claim: CLM-2026-00128</h2>
          <span class="status-pill review">Under Review</span>
        </div>
        <div class="kv-grid">
          <div class="kv"><span class="label">Hospital</span><span class="value">City General Hospital</span></div>
          <div class="kv"><span class="label">Last Updated</span><span class="value">Today, 04:30 AM</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Progress Timeline</h2></div>
        <ul class="timeline">
          <li class="done"><span class="t-label">Claim Submitted</span><span class="t-sub">02:51 AM</span></li>
          <li class="done"><span class="t-label">Documents Verified</span><span class="t-sub">03:20 AM</span></li>
          <li class="done"><span class="t-label">Pre-authorization</span><span class="t-sub">03:45 AM</span></li>
          <li class="current"><span class="t-label">Under Review</span><span class="t-sub">Insurer/TPA reviewing your case</span></li>
          <li><span class="t-label">Approval / Settlement</span></li>
        </ul>
      </div>

      <div class="card">
        <div class="card-head">
          <h2 id="docCardTitle">Documents (4 of 5 Uploaded)</h2>
          <span class="status-pill review" id="docProgressPill">80% Complete</span>
        </div>
        <div class="progress-track"><div class="progress-fill" id="docProgressFill" style="width:80%"></div></div>
        <div class="rows">
          <div class="row-item"><span>Student ID</span><span style="color:var(--green)">Uploaded</span></div>
          <div class="row-item"><span>Policy Details</span><span style="color:var(--green)">Uploaded</span></div>
          <div class="row-item"><span>Hospital Admission</span><span style="color:var(--green)">Uploaded</span></div>
          <div class="row-item"><span>Medical Report</span><span style="color:var(--green)">Uploaded</span></div>
          <div class="row-item"><span>Final Bill</span><span id="finalBillStatus" style="color:var(--amber)">Awaiting Upload</span></div>
        </div>
        <div class="btn-row">
          <button class="btn primary" onclick="openUploadBillModal()">Upload Final Bill</button>
        </div>
      </div>
    `;
  }
}

function initStudentMap() {
  const mapEl = document.getElementById('studentMap');
  if (!mapEl || typeof L === 'undefined') return;

  if (studentMapInstance) {
    studentMapInstance.remove();
    studentMapInstance = null;
  }

  studentMapInstance = L.map('studentMap').setView([studentCoords.lat, studentCoords.lng], 16);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }).addTo(studentMapInstance);

  // Student pin
  studentMarker = L.marker([studentCoords.lat, studentCoords.lng])
    .addTo(studentMapInstance)
    .bindPopup(`<b>📍 Your Location</b><br>${profile.hostelName || 'Hostel B'}, Room ${profile.roomNo || '214'}`)
    .openPopup();

  // Warden Post pin
  const wardenCoords = [studentCoords.lat + 0.0012, studentCoords.lng + 0.0015];
  L.marker(wardenCoords)
    .addTo(studentMapInstance)
    .bindPopup('<b>🛡️ Warden Post (Block B)</b><br>Campus Security & Responder Station (150m)');

  // Campus Wellness Clinic pin
  const clinicCoords = [studentCoords.lat - 0.0018, studentCoords.lng + 0.0022];
  L.marker(clinicCoords)
    .addTo(studentMapInstance)
    .bindPopup('<b>🏥 Campus Medical Clinic</b><br>Dr. Meera Joshi (250m)');

  // Polyline path connecting responder to student
  const routePoints = [
    wardenCoords,
    [studentCoords.lat + 0.0006, studentCoords.lng + 0.0008],
    [studentCoords.lat, studentCoords.lng]
  ];

  L.polyline(routePoints, {
    color: '#D8483A',
    weight: 4,
    dashArray: '8, 8',
    opacity: 0.8
  }).addTo(studentMapInstance);
}

function detectStudentGPS() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  showToast('Detecting GPS location...', 'info');

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      studentCoords = {
        lat: parseFloat(pos.coords.latitude.toFixed(5)),
        lng: parseFloat(pos.coords.longitude.toFixed(5))
      };

      const statusEl = document.getElementById('gpsStatusText');
      if (statusEl) {
        statusEl.textContent = `GPS: ${studentCoords.lat}° N, ${studentCoords.lng}° E`;
      }

      if (studentMapInstance && studentMarker) {
        studentMapInstance.setView([studentCoords.lat, studentCoords.lng], 16);
        studentMarker.setLatLng([studentCoords.lat, studentCoords.lng])
          .bindPopup(`<b>📍 Live GPS Location Detected</b><br>Lat: ${studentCoords.lat}, Lng: ${studentCoords.lng}`)
          .openPopup();
      }

      showToast(`Location detected: ${studentCoords.lat}, ${studentCoords.lng}`, 'success');
    },
    (err) => {
      console.warn('Geolocation warning:', err.message);
      showToast('GPS unavailable: Defaulted to campus hostel coordinates.', 'info');
    },
    { enableHighAccuracy: true, timeout: 6000 }
  );
}

async function triggerStudentSOS(btnEl) {
  btnEl.disabled = true;
  btnEl.innerHTML = 'ALERTING...';

  try {
    const res = await apiFetch('/emergency', {
      method: 'POST',
      body: JSON.stringify({
        type: 'Medical Emergency',
        description: 'Student requested emergency assistance from room',
        coordinates: studentCoords
      })
    });

    showToast(`🚨 SOS ALERT SENT! Live GPS coordinates (${studentCoords.lat}, ${studentCoords.lng}) transmitted to Responders.`, 'error');
    btnEl.style.background = 'var(--green)';
    btnEl.style.color = '#fff';
    btnEl.innerHTML = 'ALERT<br>SENT';

    setTimeout(() => {
      btnEl.disabled = false;
      btnEl.style.background = '#fff';
      btnEl.style.color = 'var(--sos-dark)';
      btnEl.innerHTML = 'SEND<br>SOS';
    }, 4000);
  } catch (err) {
    showToast(`SOS Error: ${err.message}`, 'error');
    btnEl.disabled = false;
    btnEl.innerHTML = 'SEND<br>SOS';
  }
}

function submitCheckin(btnEl, mood) {
  const parent = btnEl.parentElement;
  parent.querySelectorAll('button').forEach(b => b.classList.remove('picked'));
  btnEl.classList.add('picked');
  showToast(`Wellness check-in recorded: ${mood}`, 'success');
}

function openCoverageModal() {
  showModal('Policy Coverage Summary', `
    <div style="line-height:1.6;font-size:0.9rem">
      <p><strong>Provider:</strong> CampusCare TPA</p>
      <p><strong>Coverage Limit:</strong> ₹1,50,000 / year</p>
      <p><strong>Inclusions:</strong> Emergency Room, In-patient Admission, Surgical Procedures, Ambulance Escort.</p>
      <p style="margin-top:12px;color:var(--muted)">Policy Copy reference: #HC-POL-2026-98A</p>
      <div class="btn-row" style="margin-top:18px">
        <button class="btn primary" onclick="closeModal()">Close</button>
      </div>
    </div>
  `);
}

function openCardModal() {
  showModal('Digital Insurance Card', `
    <div style="background:var(--navy);color:#fff;padding:20px;border-radius:16px">
      <div style="font-weight:800;font-size:1.1rem;margin-bottom:12px">CampusCare Student Shield</div>
      <p><strong>Name:</strong> ${profile.name || user.email}</p>
      <p><strong>Member ID:</strong> HC123456</p>
      <p><strong>Hostel / Room:</strong> ${profile.hostelName || 'Hostel B'} - ${profile.roomNo || '214'}</p>
      <p style="margin-top:10px;font-size:0.8rem;opacity:0.8">Toll Free 24x7 Helpline: 1800-420-9999</p>
    </div>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn primary" onclick="closeModal()">Close Card</button>
    </div>
  `);
}

function openUploadBillModal() {
  showModal('Upload Final Hospital Bill', `
    <form onsubmit="handleBillSubmit(event)">
      <div class="field">
        <label>Select Document File (PDF / Image)</label>
        <input type="file" id="billFileInput" required>
      </div>
      <div class="field">
        <label>Amount (₹)</label>
        <input type="number" id="billAmountInput" placeholder="e.g. 12500" required>
      </div>
      <div class="btn-row">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn primary">Upload & Attach</button>
      </div>
    </form>
  `);
}

function handleBillSubmit(e) {
  e.preventDefault();
  closeModal();
  showToast('Final Hospital Bill uploaded successfully! All documents complete.', 'success');
  const statusEl = document.getElementById('finalBillStatus');
  if (statusEl) {
    statusEl.textContent = 'Uploaded';
    statusEl.style.color = 'var(--green)';
  }
  const fillEl = document.getElementById('docProgressFill');
  if (fillEl) fillEl.style.width = '100%';

  const titleEl = document.getElementById('docCardTitle');
  if (titleEl) titleEl.textContent = 'Documents (5 of 5 Uploaded)';

  const pillEl = document.getElementById('docProgressPill');
  if (pillEl) {
    pillEl.textContent = '100% Complete';
    pillEl.className = 'status-pill active';
  }
}
