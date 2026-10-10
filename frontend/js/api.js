const API_BASE = (window.location.hostname === 'localhost' && window.location.port === '4000')
  ? '/api'
  : 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('hc_token') || '';
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('hc_user') || 'null');
  } catch(e) {
    return null;
  }
}

function getCurrentProfile() {
  try {
    return JSON.parse(localStorage.getItem('hc_profile') || 'null');
  } catch(e) {
    return null;
  }
}

function setSession(token, user, profile) {
  localStorage.setItem('hc_token', token);
  localStorage.setItem('hc_user', JSON.stringify(user));
  localStorage.setItem('hc_profile', JSON.stringify(profile));
}

function clearSession() {
  localStorage.removeItem('hc_token');
  localStorage.removeItem('hc_user');
  localStorage.removeItem('hc_profile');
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Server error');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function showModal(title, htmlContent) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'activeModal';

  overlay.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <h3>${title}</h3>
        <button class="modal-close" onclick="closeModal()">&times;</button>
      </div>
      <div class="modal-body">${htmlContent}</div>
    </div>
  `;

  document.body.appendChild(overlay);
}

function closeModal() {
  const modal = document.getElementById('activeModal');
  if (modal) modal.remove();
}

function logout() {
  clearSession();
  window.location.href = '/pages/login.html';
}

function checkAuth(expectedRole) {
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) {
    window.location.href = '/pages/login.html';
    return false;
  }

  if (expectedRole && user.role !== expectedRole) {
    showToast(`Redirecting to your role (${user.role})...`, 'info');
    window.location.href = `/pages/${user.role}-dashboard.html`;
    return false;
  }

  return true;
}
