let authMode = 'login';
let selectedRole = 'student';

const ROLES = [
  { id: 'student', label: 'Student', icon: '<path d="M3 11l9-7 9 7"/><path d="M5 10v9h14v-9"/>' },
  { id: 'warden', label: 'Warden', icon: '<path d="M12 3L2 20h20L12 3z"/><path d="M12 10v4"/><path d="M12 17h.01"/>' },
  { id: 'teacher', label: 'Teacher', icon: '<circle cx="9" cy="8" r="3"/><path d="M2 20c0-3 3-5.5 7-5.5s7 2.5 7 5.5"/>' },
  { id: 'doctor', label: 'Doctor', icon: '<path d="M4 12h4l2-6 4 12 2-6h4"/>' },
  { id: 'admin', label: 'Admin', icon: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>' }
];

const PROFILE_SCHEMAS = {
  student: [
    { key: 'name', label: 'Full Name', placeholder: 'Aditi Sharma' },
    { key: 'course', label: 'Course', placeholder: 'B.Tech CSE' },
    { key: 'rollNo', label: 'Roll No', placeholder: '2026-CS-104' },
    { key: 'section', label: 'Section', placeholder: 'Sec B' },
    { key: 'hostelName', label: 'Hostel Name', placeholder: 'Hostel B' },
    { key: 'roomNo', label: 'Room No', placeholder: '214' },
    { key: 'floor', label: 'Floor', placeholder: '2nd Floor' }
  ],
  warden: [
    { key: 'name', label: 'Full Name', placeholder: 'Ramesh Iyer' },
    { key: 'hostelName', label: 'Hostel Assigned', placeholder: 'Hostel B' },
    { key: 'block', label: 'Block', placeholder: 'Block B' },
    { key: 'contact', label: 'Contact Phone', placeholder: '+91 9876543210' }
  ],
  teacher: [
    { key: 'name', label: 'Full Name', placeholder: 'Prof. Kabir Rao' },
    { key: 'department', label: 'Department', placeholder: 'Computer Science' },
    { key: 'designation', label: 'Designation', placeholder: 'Associate Professor' },
    { key: 'assignedHostel', label: 'Block Assigned', placeholder: 'Block B' }
  ],
  doctor: [
    { key: 'name', label: 'Full Name', placeholder: 'Dr. Meera Joshi' },
    { key: 'specialization', label: 'Specialization', placeholder: 'General Physician' },
    { key: 'hospital', label: 'Clinic / Hospital', placeholder: 'Campus Wellness Centre' }
  ],
  admin: [
    { key: 'name', label: 'Full Name', placeholder: 'Priya Nair' },
    { key: 'designation', label: 'Designation', placeholder: 'Chief Administrator' }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  renderRoleGrid();
  renderProfileFields();
});

function renderRoleGrid() {
  const container = document.getElementById('roleGrid');
  if (!container) return;

  container.innerHTML = ROLES.map(r => `
    <button type="button" class="role-chip ${r.id === selectedRole ? 'active' : ''}" onclick="selectRole('${r.id}')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">${r.icon}</svg>
      ${r.label}
    </button>
  `).join('');
}

function selectRole(roleId) {
  selectedRole = roleId;
  renderRoleGrid();
  if (authMode === 'signup') {
    renderProfileFields();
  }
}

function quickFill(roleId) {
  switchAuthTab('login');
  selectRole(roleId);
  const emailInput = document.getElementById('emailInput');
  const passwordInput = document.getElementById('passwordInput');
  if (emailInput) emailInput.value = `${roleId}@hostelcare.edu`;
  if (passwordInput) passwordInput.value = 'password123';
  showToast(`Loaded ${roleId.toUpperCase()} demo credentials! Press Log In.`, 'info');
}

function switchAuthTab(mode) {
  authMode = mode;
  document.getElementById('tabLoginBtn').classList.toggle('active', mode === 'login');
  document.getElementById('tabSignupBtn').classList.toggle('active', mode === 'signup');

  const subText = document.getElementById('authSubText');
  const signupFields = document.getElementById('signupFields');
  const submitBtn = document.getElementById('submitBtn');

  if (mode === 'signup') {
    subText.textContent = 'Create a new HostelCare account.';
    signupFields.style.display = 'block';
    submitBtn.textContent = 'Sign Up & Continue';
    renderProfileFields();
  } else {
    subText.textContent = 'Sign in to access your role dashboard.';
    signupFields.style.display = 'none';
    submitBtn.textContent = 'Log In';
  }
}

function renderProfileFields() {
  const container = document.getElementById('profileFieldsGrid');
  if (!container) return;

  const fields = PROFILE_SCHEMAS[selectedRole] || [];
  container.innerHTML = fields.map(f => `
    <div class="field">
      <label for="pf_${f.key}">${f.label}</label>
      <input id="pf_${f.key}" type="text" placeholder="${f.placeholder}">
    </div>
  `).join('');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value.trim();

  if (!email || !password) {
    showToast('Please enter both email and password.', 'error');
    return;
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Processing...';

  try {
    if (authMode === 'signup') {
      // Collect profile data
      const profile = { name: email.split('@')[0] };
      const schema = PROFILE_SCHEMAS[selectedRole] || [];
      schema.forEach(f => {
        const val = document.getElementById(`pf_${f.key}`)?.value?.trim();
        if (val) profile[f.key] = val;
      });

      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, role: selectedRole, profile })
      });

      setSession(res.token, res.user, res.profile);
      showToast('Account created successfully!', 'success');
      window.location.href = `/pages/${res.user.role}-dashboard.html`;

    } else {
      // Log In
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      setSession(res.token, res.user, res.profile);
      showToast('Logged in successfully!', 'success');
      window.location.href = `/pages/${res.user.role}-dashboard.html`;
    }
  } catch (err) {
    showToast(err.message || 'Authentication failed', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = authMode === 'signup' ? 'Sign Up & Continue' : 'Log In';
  }
}
