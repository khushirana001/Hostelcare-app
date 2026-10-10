let currentTab = 'emergencies';
let user = null;
let profile = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth('warden')) return;

  user = getCurrentUser();
  profile = getCurrentProfile() || {};

  document.getElementById('userName').textContent = profile.name || user.email;
  document.getElementById('userSub').textContent = `Warden · ${profile.hostelName || 'Hostel B'}, Block ${profile.block || 'B'}`;

  renderTab('emergencies');
});

function switchWardenTab(tab) {
  currentTab = tab;
  ['Emergencies', 'Requests'].forEach(t => {
    const key = t.toLowerCase();
    const isAct = key === tab;
    const rEl = document.getElementById(`nav${t}`);
    const mEl = document.getElementById(`mNav${t}`);
    if (rEl) rEl.classList.toggle('active', isAct);
    if (mEl) mEl.classList.toggle('active', isAct);
  });

  renderTab(tab);
}

async function renderTab(tab) {
  const root = document.getElementById('contentRoot');
  document.getElementById('pageTitle').textContent = tab === 'emergencies' ? 'Emergency Dispatch & Alerts' : 'Pending Requests';

  if (tab === 'emergencies') {
    let emergenciesList = [];
    try {
      const res = await apiFetch('/emergency');
      emergenciesList = res.emergencies || [];
    } catch (e) {
      console.log('Using default emergency view');
    }

    root.innerHTML = `
      <div class="card" style="border-left:4px solid var(--sos)">
        <div class="card-head">
          <h2>1 Active Emergency — Room 214</h2>
          <span class="status-pill urgent">High Priority</span>
        </div>
        <div class="rows">
          <div class="row-item"><span>Student</span><span>Aditi Sharma</span></div>
          <div class="row-item"><span>Location</span><span>Hostel B · Room 214 (Floor 2)</span></div>
          <div class="row-item"><span>Type</span><span>Injury · Reported mobility issue</span></div>
          <div class="row-item"><span>Reported Time</span><span>Today, 02:03 AM</span></div>
        </div>
        <div class="btn-row">
          <button class="btn primary" id="dispatchBtn" onclick="dispatchResponder('sos_214')">Dispatch Responder</button>
          <button class="btn danger" id="ambulanceBtn" onclick="openAmbulanceCallModal('sos_214', 'Aditi Sharma', 'Hostel B, Room 214')">🚑 Call Ambulance</button>
          <button class="btn" onclick="openTimelineModal('Room 214 - Aditi Sharma')">View Timeline</button>
          <button class="btn" onclick="openEmergencyMapModal('Room 214 - Aditi Sharma', 28.5450, 77.1926)">🗺️ Track on Live Map</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Today's Incidents Summary</h2></div>
        <div class="rows">
          <div class="row-item"><span>Room 214 · Injury</span><span id="room214Status" style="color:var(--amber)">Responder En Route</span></div>
          <div class="row-item"><span>Room 108 · Fever Check</span><span style="color:var(--green)">Resolved</span></div>
          <div class="row-item"><span>Room 302 · Anxiety Episode</span><span style="color:var(--green)">Resolved</span></div>
        </div>
      </div>
    `;
  } else if (tab === 'requests') {
    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>Pending Student Requests</h2>
          <span class="status-pill review">2 Pending</span>
        </div>
        <div class="rows">
          <div class="row-item">
            <div>
              <strong>Aditi Sharma</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Hospital Escort Request · City General</div>
            </div>
            <span class="status-pill review" id="req1Status">Pending</span>
          </div>
          <div class="row-item">
            <div>
              <strong>Rohit Kumar</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Medical Leave Request · 3 Days</div>
            </div>
            <span class="status-pill review" id="req2Status">Pending</span>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn primary" onclick="approveRequest('req1Status')">Approve Escort</button>
          <button class="btn" onclick="forwardRequest('req2Status')">Forward to Admin</button>
        </div>
      </div>
    `;
  }
}

async function dispatchResponder(id) {
  const btn = document.getElementById('dispatchBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Dispatching...';
  }

  try {
    await apiFetch(`/emergency/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'responder_assigned' })
    }).catch(() => {});

    showToast('🚀 Responder Dispatched! Notification sent to student & security team.', 'success');
    const statusEl = document.getElementById('room214Status');
    if (statusEl) {
      statusEl.textContent = 'Responder Dispatched';
      statusEl.style.color = 'var(--green)';
    }
    if (btn) {
      btn.textContent = 'Responder Dispatched';
      btn.style.background = 'var(--green)';
      btn.style.borderColor = 'var(--green)';
    }
  } catch (err) {
    showToast(`Dispatch failed: ${err.message}`, 'error');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Dispatch Responder';
    }
  }
}

function openTimelineModal(title) {
  showModal(`Incident Timeline — ${title}`, `
    <ul class="timeline">
      <li class="done"><span class="t-label">02:03 AM — SOS Pressed</span><span class="t-sub">Student pressed emergency button from Room 214</span></li>
      <li class="done"><span class="t-label">02:04 AM — Automated Alert</span><span class="t-sub">Warden & Medical team notified</span></li>
      <li class="current"><span class="t-label">02:06 AM — Dispatch Initiated</span><span class="t-sub">Warden assigned campus first responder</span></li>
      <li><span class="t-label">On the way</span><span class="t-sub">Responder reaching Room 214</span></li>
      <li><span class="t-label">Resolution</span></li>
    </ul>
    <div class="btn-row" style="margin-top:20px">
      <button class="btn primary" onclick="closeModal()">Close Timeline</button>
    </div>
  `);
}

function approveRequest(statusId) {
  const el = document.getElementById(statusId);
  if (el) {
    el.textContent = 'Approved';
    el.className = 'status-pill active';
  }
  showToast('Request Approved successfully!', 'success');
}

function forwardRequest(statusId) {
  const el = document.getElementById(statusId);
  if (el) {
    el.textContent = 'Forwarded';
    el.className = 'status-pill review';
  }
  showToast('Request forwarded to College Admin.', 'info');
}

function openEmergencyMapModal(title, lat, lng) {
  showModal(`🗺️ Live Emergency Tracking — ${title}`, `
    <div style="font-size:0.88rem;color:var(--muted);margin-bottom:10px">
      GPS Coordinates: <b>${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E</b> | Status: <b style="color:var(--sos-dark)">Active Responder En Route</b>
    </div>
    <div id="wardenModalMap" class="modal-map-canvas"></div>
    <div class="btn-row" style="margin-top:18px">
      <button class="btn primary" onclick="closeModal()">Close Map</button>
    </div>
  `);

  setTimeout(() => {
    if (typeof L === 'undefined') return;
    const map = L.map('wardenModalMap').setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Student Emergency Pin
    L.circleMarker([lat, lng], { radius: 10, color: '#E53E3E', fillOpacity: 0.9 })
      .addTo(map)
      .bindPopup(`<b>🚨 Emergency Alert: ${title}</b><br>Injury · Reported Mobility Issue<br>Location: Hostel B, Room 214`)
      .openPopup();

    // Responder Pin
    const respLat = lat + 0.0022;
    const respLng = lng + 0.0018;
    L.circleMarker([respLat, respLng], { radius: 9, color: '#2563EB', fillOpacity: 0.9 })
      .addTo(map)
      .bindPopup('<b>🚑 Campus Responder Alpha</b><br>Speed: 18 km/h | ETA: 2 mins');

    // Hospital Pin
    const hospLat = lat - 0.0045;
    const hospLng = lng - 0.0035;
    L.circleMarker([hospLat, hospLng], { radius: 9, color: '#1E8E5A', fillOpacity: 0.9 })
      .addTo(map)
      .bindPopup('<b>🏥 City General Hospital</b><br>In Network | Distance: 1.2 km');

    // Route line
    L.polyline([[respLat, respLng], [lat, lng], [hospLat, hospLng]], {
      color: '#E53E3E',
      weight: 4,
      dashArray: '6, 6'
    }).addTo(map);
  }, 250);
}

function openAmbulanceCallModal(id, studentName, location) {
  showModal('🚑 Emergency Ambulance Dispatch', `
    <div style="background:rgba(229,62,62,0.08);border:1px solid rgba(229,62,62,0.22);border-radius:14px;padding:16px;margin-bottom:18px">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <strong style="color:var(--sos-dark);font-size:1.05rem">🚨 Critical Medical Dispatch</strong>
        <span class="status-pill urgent">High Priority</span>
      </div>
      <p style="font-size:0.88rem;margin-top:6px;color:var(--text)">
        <strong>Patient:</strong> ${studentName} | <strong>Pickup Location:</strong> ${location}
      </p>
    </div>

    <div class="field">
      <label>Select Ambulance Unit</label>
      <select id="ambUnitSelect">
        <option value="Campus Rapid Ambulance #102">Campus Rapid Ambulance #102 (On Campus · ETA 3 mins)</option>
        <option value="City General Hospital ICU Ambulance">City General Hospital ICU Unit (ETA 6 mins)</option>
        <option value="National Emergency 108">National Emergency 108 Emergency Service</option>
      </select>
    </div>

    <div class="field">
      <label>Destination Hospital</label>
      <select id="ambHospSelect">
        <option value="City General Hospital">City General Hospital (In Network · 1.2 km)</option>
        <option value="Apollo Wellness Centre">Apollo Wellness Centre (In Network · 2.4 km)</option>
      </select>
    </div>

    <!-- DIRECT EMERGENCY SPEED DIAL -->
    <div style="background:var(--bg);border-radius:12px;padding:14px;margin-bottom:18px">
      <span style="font-size:0.78rem;font-weight:800;color:var(--navy);display:block;margin-bottom:8px;text-transform:uppercase">Direct Phone Speed-Dial:</span>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <a href="tel:108" class="btn danger" style="text-decoration:none;font-size:0.82rem;padding:8px 14px">📞 Call 108</a>
        <a href="tel:102" class="btn primary" style="text-decoration:none;font-size:0.82rem;padding:8px 14px">📞 Call 102 (Campus)</a>
        <a href="tel:+919876500102" class="btn" style="text-decoration:none;font-size:0.82rem;padding:8px 14px">📞 Driver Direct</a>
      </div>
    </div>

    <div class="btn-row">
      <button type="button" class="btn" onclick="closeModal()">Cancel</button>
      <button type="button" class="btn danger" onclick="confirmAmbulanceDispatch('${id}')">⚡ Confirm & Dispatch Ambulance</button>
    </div>
  `);
}

async function confirmAmbulanceDispatch(id) {
  const unit = document.getElementById('ambUnitSelect')?.value || 'Campus Rapid Ambulance #102';
  const hosp = document.getElementById('ambHospSelect')?.value || 'City General Hospital';
  closeModal();

  try {
    await apiFetch(`/emergency/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ambulance_dispatched' })
    }).catch(() => {});

    showToast(`🚑 ${unit} DISPATCHED! Campus gates cleared for entry. Destination: ${hosp}.`, 'error');

    const statusEl = document.getElementById('room214Status');
    if (statusEl) {
      statusEl.textContent = 'Ambulance En Route (ETA 3m)';
      statusEl.style.color = 'var(--sos-dark)';
    }

    const ambBtn = document.getElementById('ambulanceBtn');
    if (ambBtn) {
      ambBtn.textContent = '🚑 Ambulance En Route (3m)';
      ambBtn.className = 'btn primary';
    }
  } catch (err) {
    showToast(`Ambulance dispatch error: ${err.message}`, 'error');
  }
}
