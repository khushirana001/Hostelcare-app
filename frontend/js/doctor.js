let currentTab = 'alerts';
let user = null;
let profile = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth('doctor')) return;

  user = getCurrentUser();
  profile = getCurrentProfile() || {};

  document.getElementById('userName').textContent = profile.name || user.email;
  document.getElementById('userSub').textContent = `${profile.specialization || 'General Physician'} · ${profile.hospital || 'Campus Wellness Centre'}`;

  renderTab('alerts');
});

function switchDoctorTab(tab) {
  currentTab = tab;
  ['Alerts', 'Patients'].forEach(t => {
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
  document.getElementById('pageTitle').textContent = tab === 'alerts' ? 'Medical Alerts & Triage' : 'Active Patient Cases';

  if (tab === 'alerts') {
    root.innerHTML = `
      <div class="card">
        <div class="stat-grid">
          <div><div class="stat-v">2</div><div class="stat-l">Active Alerts</div></div>
          <div><div class="stat-v">1</div><div class="stat-l">High Priority</div></div>
          <div><div class="stat-v">6m</div><div class="stat-l">Avg Response Time</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Incoming Medical Alerts</h2></div>
        <div class="rows">
          <div class="row-item">
            <div>
              <strong>Aditi Sharma</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Hostel B · Room 214 (Reported Mobility Issue)</div>
            </div>
            <span class="badge-risk-high">Immediate Response</span>
          </div>
          <div class="row-item">
            <div>
              <strong>Sneha Gupta</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Hostel C · Room 302 (Anxiety Episode)</div>
            </div>
            <span class="badge-risk-med">Under Triage</span>
          </div>
        </div>
      </div>
    `;
  } else if (tab === 'patients') {
    root.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>Active Student Cases</h2></div>
        <div class="rows">
          <div class="row-item">
            <div>
              <strong>Aditi Sharma</strong>
              <div style="font-size:0.8rem;color:var(--muted)">City General · Discharge Summary Pending</div>
            </div>
            <span class="status-pill review" id="pat1Status">Under Observation</span>
          </div>
          <div class="row-item">
            <div>
              <strong>Rohit Kumar</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Resting in Hostel A, 108</div>
            </div>
            <span class="status-pill active" id="pat2Status">Recovering</span>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn primary" onclick="openUploadReportModal()">Upload Medical Report</button>
          <button class="btn" onclick="openUpdateStatusModal()">Update Treatment Status</button>
        </div>
      </div>
    `;
  }
}

function openUploadReportModal() {
  showModal('Upload Patient Medical Report', `
    <form onsubmit="handleUploadReport(event)">
      <div class="field">
        <label>Select Patient</label>
        <select id="reportPatientSelect">
          <option value="Aditi Sharma">Aditi Sharma (Room 214)</option>
          <option value="Rohit Kumar">Rohit Kumar (Room 108)</option>
        </select>
      </div>
      <div class="field">
        <label>Report Type</label>
        <select id="reportTypeSelect">
          <option value="Discharge Summary">Discharge Summary</option>
          <option value="X-Ray & Scan Report">X-Ray & Scan Report</option>
          <option value="Prescription & Treatment">Prescription & Treatment</option>
        </select>
      </div>
      <div class="field">
        <label>Report File</label>
        <input type="file" required>
      </div>
      <div class="btn-row">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn primary">Upload & Attach</button>
      </div>
    </form>
  `);
}

function handleUploadReport(e) {
  e.preventDefault();
  const patient = document.getElementById('reportPatientSelect').value;
  closeModal();
  showToast(`Medical report attached to ${patient}'s record.`, 'success');
}

function openUpdateStatusModal() {
  showModal('Update Patient Treatment Status', `
    <form onsubmit="handleUpdateStatus(event)">
      <div class="field">
        <label>Select Patient</label>
        <select id="statusPatientSelect">
          <option value="pat1Status">Aditi Sharma (Room 214)</option>
          <option value="pat2Status">Rohit Kumar (Room 108)</option>
        </select>
      </div>
      <div class="field">
        <label>New Status</label>
        <select id="newStatusSelect">
          <option value="Under Observation">Under Observation</option>
          <option value="Recovering">Recovering</option>
          <option value="Discharged / Closed">Discharged / Closed</option>
        </select>
      </div>
      <div class="btn-row">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn primary">Update Status</button>
      </div>
    </form>
  `);
}

function handleUpdateStatus(e) {
  e.preventDefault();
  const targetId = document.getElementById('statusPatientSelect').value;
  const newStatus = document.getElementById('newStatusSelect').value;
  closeModal();

  const el = document.getElementById(targetId);
  if (el) {
    el.textContent = newStatus;
    el.className = newStatus.includes('Closed') || newStatus.includes('Recovering') ? 'status-pill active' : 'status-pill review';
  }
  showToast(`Patient status updated to '${newStatus}'`, 'success');
}
