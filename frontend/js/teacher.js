let currentTab = 'overview';
let user = null;
let profile = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth('teacher')) return;

  user = getCurrentUser();
  profile = getCurrentProfile() || {};

  document.getElementById('userName').textContent = profile.name || user.email;
  document.getElementById('userSub').textContent = `${profile.designation || 'Faculty Mentor'} · ${profile.department || 'Department'}`;

  renderTab('overview');
});

function switchTeacherTab(tab) {
  currentTab = tab;
  ['Overview', 'Notes'].forEach(t => {
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
  document.getElementById('pageTitle').textContent = tab === 'overview' ? 'Mentorship & Student Overview' : 'Wellness Check-in Feed';

  if (tab === 'overview') {
    root.innerHTML = `
      <div class="card">
        <div class="stat-grid">
          <div><div class="stat-v">42</div><div class="stat-l">Assigned Students</div></div>
          <div><div class="stat-v">3</div><div class="stat-l">Follow-ups Open</div></div>
          <div><div class="stat-v">12</div><div class="stat-l">Check-ins Today</div></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Students Needing Health Follow-up</h2></div>
        <div class="rows">
          <div class="row-item">
            <div>
              <strong>Aditi Sharma</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Hostel B · Room 214 (Leg Sprain)</div>
            </div>
            <span class="badge-risk-med">Medium Attention</span>
          </div>
          <div class="row-item">
            <div>
              <strong>Rohit Kumar</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Hostel A · Room 108 (Fever Follow-up)</div>
            </div>
            <span class="badge-risk-low">Recovering</span>
          </div>
          <div class="row-item">
            <div>
              <strong>Sneha Gupta</strong>
              <div style="font-size:0.8rem;color:var(--muted)">Hostel C · Room 302 (Needs Assistance)</div>
            </div>
            <span class="badge-risk-high">High Priority</span>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Quick Actions</h2></div>
        <div class="btn-row">
          <button class="btn primary" onclick="openMessageStudentModal()">Message Student</button>
          <button class="btn" onclick="openNotifyWardenModal()">Notify Warden</button>
        </div>
      </div>
    `;
  } else if (tab === 'notes') {
    root.innerHTML = `
      <div class="card">
        <div class="card-head"><h2>Recent Student Daily Check-ins</h2></div>
        <div class="rows">
          <div class="row-item"><span>Aditi Sharma</span><span>😐 Still Unwell · Today 08:30 AM</span></div>
          <div class="row-item"><span>Rohit Kumar</span><span>🙂 Better · Yesterday</span></div>
          <div class="row-item"><span>Sneha Gupta</span><span>🚨 Needs Assistance · Today 09:15 AM</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Send Wellness Note</h2></div>
        <div class="btn-row">
          <button class="btn primary" onclick="openMessageStudentModal()">Send Wellness Note to Student</button>
        </div>
      </div>
    `;
  }
}

function openMessageStudentModal() {
  showModal('Send Wellness Message to Student', `
    <form onsubmit="handleSendWellnessMsg(event)">
      <div class="field">
        <label>Select Student</label>
        <select id="studentSelect">
          <option value="Aditi Sharma">Aditi Sharma (Hostel B, 214)</option>
          <option value="Rohit Kumar">Rohit Kumar (Hostel A, 108)</option>
          <option value="Sneha Gupta">Sneha Gupta (Hostel C, 302)</option>
        </select>
      </div>
      <div class="field">
        <label>Message Note</label>
        <input type="text" id="msgContent" placeholder="e.g. Please update me on how your leg recovery is progressing." required>
      </div>
      <div class="btn-row">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn primary">Send Message</button>
      </div>
    </form>
  `);
}

function handleSendWellnessMsg(e) {
  e.preventDefault();
  const student = document.getElementById('studentSelect').value;
  closeModal();
  showToast(`Wellness message sent to ${student}!`, 'success');
}

function openNotifyWardenModal() {
  showModal('Escalate Note to Warden', `
    <form onsubmit="handleNotifyWarden(event)">
      <div class="field">
        <label>Student Name</label>
        <input type="text" id="escStudent" value="Sneha Gupta (Room 302)" required>
      </div>
      <div class="field">
        <label>Reason / Concern</label>
        <input type="text" id="escReason" placeholder="e.g. Student reported high fever during morning check-in." required>
      </div>
      <div class="btn-row">
        <button type="button" class="btn" onclick="closeModal()">Cancel</button>
        <button type="submit" class="btn primary">Send to Warden</button>
      </div>
    </form>
  `);
}

function handleNotifyWarden(e) {
  e.preventDefault();
  closeModal();
  showToast('Escalation alert sent to Hostel Warden!', 'info');
}
