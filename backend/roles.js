const ROLES = ['student', 'warden', 'teacher', 'admin', 'doctor'];

// Fields each role fills in during onboarding. Kept in sync with the frontend's profile form.
const PROFILE_FIELDS = {
  student: ['name', 'course', 'rollNo', 'section', 'hostelName', 'roomNo', 'floor'],
  warden: ['name', 'hostelName', 'block', 'contact'],
  teacher: ['name', 'department', 'designation', 'assignedHostel'],
  admin: ['name', 'designation'],
  doctor: ['name', 'specialization', 'hospital']
};

function pickProfileFields(role, body = {}) {
  const fields = PROFILE_FIELDS[role] || [];
  const out = {};
  fields.forEach((f) => { out[f] = typeof body[f] === 'string' ? body[f].trim() : ''; });
  return out;
}

module.exports = { ROLES, PROFILE_FIELDS, pickProfileFields };
