let currentTab = 'overview';
let user = null;
let profile = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth('admin')) return;

  user = getCurrentUser();
  profile = getCurrentProfile() || {};

  document.getElementById('userName').textContent = profile.name || user.email;
  document.getElementById('userSub').textContent = `${profile.designation || 'College Administrator'}`;

  renderTab('overview');
});

function switchAdminTab(tab) {
  currentTab = tab;
  ['Overview', 'Manage'].forEach(t => {
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
  document.getElementById('pageTitle').textContent = tab === 'overview' ? 'Insurance Center Overview' : 'Network & System Management';

  if (tab === 'overview') {
    let stats = {
      studentsCovered: 4820,
      activePolicies: 4731,
      pendingEnrollment: 89,
      claimsThisYear: 126,
      pendingClaims: 18,
      settledClaims: 92
    };

    try {
      const res = await apiFetch('/insurance/overview');
      if (res) stats = res;
    } catch (e) {
      console.log('Using aggregated statistics');
    }

    root.innerHTML = `
      <div class="card">
        <div class="stat-grid">
          <div><div class="stat-v">${stats.studentsCovered}</div><div class="stat-l">Students Covered</div></div>
          <div><div class="stat-v">${stats.activePolicies}</div><div class="stat-l">Active Policies</div></div>
          <div><div class="stat-v">${stats.pendingEnrollment}</div><div class="stat-l">Pending Enrollment</div></div>
          <div><div class="stat-v">${stats.claimsThisYear}</div><div class="stat-l">Claims This Year</div></div>
          <div><div class="stat-v">${stats.pendingClaims}</div><div class="stat-l">Pending Claims</div></div>
          <div><div class="stat-v">${stats.settledClaims}</div><div class="stat-l">Settled Claims</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Recent Insurance Claims</h2></div>
        <div class="rows">
          <div class="row-item"><span>CLM-2026-00128 · Aditi Sharma</span><span style="color:var(--amber)">Under Review</span></div>
          <div class="row-item"><span>CLM-2026-00124 · Rohit Kumar</span><span style="color:var(--green)">Approved</span></div>
          <div class="row-item"><span>CLM-2026-00119 · Sneha Gupta</span><span style="color:var(--green)">Settled</span></div>
        </div>
      </div>
    `;
  } else if (tab === 'manage') {
    let hospitalsList = [];
    try {
      const res = await apiFetch('/insurance/hospitals');
      hospitalsList = res.hospitals || [];
    } catch(e) {}

    root.innerHTML = `
      <div class="card">
        <div class="card-head">
          <h2>Network Hospitals & Healthcare Providers</h2>
          <button class="btn primary" onclick="openAddHospitalModal()">+ Add Network Hospital</button>
        </div>
        <div class="rows" id="hospitalRowsList">
          ${hospitalsList.length > 0 ? hospitalsList.map(h => `
            <div class="row-item">
              <div>
                <strong>${h.name}</strong>
                <div style="font-size:0.8rem;color:var(--muted)">Distance: ${h.distanceKm || '1.5'} km from campus</div>
              </div>
              <span class="status-pill ${h.network ? 'active' : 'review'}">${h.network ? 'In Network' : 'Out of Network'}</span>
            </div>
          `).join('') : `
            <div class="row-item">
              <div><strong>City General Hospital</strong><div style="font-size:0.8rem;color:var(--muted)">Distance: 1.2 km</div></div>
              <span class="status-pill active">In Network</span>
            </div>
            <div class="row-item">
              <div><strong>St. Mary's Care</strong><div style="font-size:0.8rem;color:var(--muted)">Distance: 3.8 km</div></div>
              <span class="status-pill review">Out of Network</span>
            </div>
            <div class="row-item">
              <div><strong>Apollo Wellness Centre</strong><div style="font-size:0.8rem;color:var(--muted)">Distance: 2.4 km</div></div>
              <span class="status-pill active">In Network</span>
            </div>
          `}
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Reports & Analytics</h2></div>
        <div class="btn-row">
          <button class="btn" onclick="openReportModal('Incident')">Incident Analytics</button>
          <button class="btn" onclick="openReportModal('Processing Time')">Claim Processing Time</button>
          <button class="btn" onclick="openReportModal('Renewals')">Policy Renewals (89 Due)</button>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Directory & Student Management</h2></div>
        <div class="btn-row">
          <button class="btn primary" onclick="openDirectoryModal('students')">Manage Students</button>
          <button class="btn" onclick="openDirectoryModal('hostels')">Manage Hostels</button>
        </div>
      </div>
    `;
  }
}

function openAddHospitalModal() {
  showModal('Add Network Hospital', `
    <form onsubmit="handleAddHospital(event)">
      <div class="field">
        <label>Hospital Name</label>
        <input type="text" id="hosNameInput" placeholder="e.g. Max Healthcare Centre" required>
      </div>
      <div class="field">
        <label>Distance (km)</label>
        <input type="number" step="0.1" id="hosDistanceInput" placeholder="e.g. 2.5" required>
      </div>
      <div class="field">
        <label>Network Status</label>
        <select id="hosNetworkSelect">
          <option value="true">In Network</option>
          <option value="false">Out of Network</option>
        </select>
      </div>
      <div class="btn-row">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn primary">Save Hospital</button>
      </div>
    </form>
  `);
}

async function handleAddHospital(e) {
  e.preventDefault();
  const name = document.getElementById('hosNameInput').value.trim();
  const distanceKm = parseFloat(document.getElementById('hosDistanceInput').value);
  const network = document.getElementById('hosNetworkSelect').value === 'true';

  try {
    await apiFetch('/insurance/hospitals', {
      method: 'POST',
      body: JSON.stringify({ name, distanceKm, network, emergencyService: true })
    });
    showToast('Hospital added to network!', 'success');
    closeModal();
    renderTab('manage');
  } catch (err) {
    showToast(`Error adding hospital: ${err.message}`, 'error');
  }
}

function openDirectoryModal(type) {
  if (type === 'students') {
    showModal('Student Directory', `
      <div class="rows">
        <div class="row-item"><span>Aditi Sharma (Hostel B, 214)</span><span style="color:var(--green)">Policy Active</span></div>
        <div class="row-item"><span>Rohit Kumar (Hostel A, 108)</span><span style="color:var(--green)">Policy Active</span></div>
        <div class="row-item"><span>Sneha Gupta (Hostel C, 302)</span><span style="color:var(--amber)">Pending Enrollment</span></div>
      </div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn primary" onclick="closeModal()">Close Directory</button>
      </div>
    `);
  } else {
    showModal('Hostels Overview', `
      <div class="rows">
        <div class="row-item"><span>Hostel A · Boys</span><span>180 Students</span></div>
        <div class="row-item"><span>Hostel B · Girls</span><span>210 Students</span></div>
        <div class="row-item"><span>Hostel C · Girls</span><span>195 Students</span></div>
      </div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn primary" onclick="closeModal()">Close Overview</button>
      </div>
    `);
  }
}

function openReportModal(reportName) {
  showModal(`${reportName} Summary Report`, `
    <p style="font-size:0.9rem;line-height:1.5">
      <strong>Report generated:</strong> Today, 10:00 AM<br>
      Average resolution time: <strong>4.2 hours</strong>.<br>
      Compliance rate across all hostels: <strong>98.4%</strong>.
    </p>
    <div class="btn-row" style="margin-top:16px">
      <button class="btn primary" onclick="closeModal()">Close Report</button>
    </div>
  `);
}
