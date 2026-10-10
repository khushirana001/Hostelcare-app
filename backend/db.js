const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data', 'db.json');

const EMPTY_DB = {
  users: [],       // { id, email, passwordHash, role }
  profiles: [],     // { userId, role, ...role-specific fields }
  emergencies: [],  // { id, studentId, type, description, priority, status, location, timeline: [], createdAt }
  hospitals: [],    // { id, name, distanceKm, network, emergencyService }
  policies: [],     // { id, studentId, provider, memberId, validFrom, validUntil, status }
  claims: []        // { id, studentId, hospitalId, incidentId, status, documents: [], timeline: [], createdAt }
};

let idCounter = Date.now();
function genId(prefix) {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function seed(db) {
  const hash = bcrypt.hashSync('password123', 10);

  const demoAccounts = [
    {
      user: { id: 'usr_student1', email: 'student@hostelcare.edu', passwordHash: hash, role: 'student' },
      profile: { userId: 'usr_student1', role: 'student', name: 'Aditi Sharma', course: 'B.Tech CSE', rollNo: '2026-CS-104', section: 'Sec B', hostelName: 'Hostel B', roomNo: '214', floor: '2nd Floor' }
    },
    {
      user: { id: 'usr_warden1', email: 'warden@hostelcare.edu', passwordHash: hash, role: 'warden' },
      profile: { userId: 'usr_warden1', role: 'warden', name: 'Ramesh Iyer', hostelName: 'Hostel B', block: 'Block B', contact: '+91 9876543210' }
    },
    {
      user: { id: 'usr_teacher1', email: 'teacher@hostelcare.edu', passwordHash: hash, role: 'teacher' },
      profile: { userId: 'usr_teacher1', role: 'teacher', name: 'Prof. Kabir Rao', department: 'Computer Science', designation: 'Associate Professor', assignedHostel: 'Block B' }
    },
    {
      user: { id: 'usr_doctor1', email: 'doctor@hostelcare.edu', passwordHash: hash, role: 'doctor' },
      profile: { userId: 'usr_doctor1', role: 'doctor', name: 'Dr. Meera Joshi', specialization: 'General Physician', hospital: 'Campus Wellness Centre' }
    },
    {
      user: { id: 'usr_admin1', email: 'admin@hostelcare.edu', passwordHash: hash, role: 'admin' },
      profile: { userId: 'usr_admin1', role: 'admin', name: 'Priya Nair', designation: 'College Administrator' }
    }
  ];

  demoAccounts.forEach(acc => {
    db.users.push(acc.user);
    db.profiles.push(acc.profile);
  });

  db.hospitals.push(
    { id: genId('hos'), name: 'City General Hospital', distanceKm: 1.2, network: true, emergencyService: true },
    { id: genId('hos'), name: "St. Mary's Care", distanceKm: 3.8, network: false, emergencyService: true },
    { id: genId('hos'), name: 'Apollo Wellness Centre', distanceKm: 2.4, network: true, emergencyService: false }
  );

  return db;
}

function loadDB() {
  if (!fs.existsSync(DB_PATH)) {
    const fresh = seed(structuredClone(EMPTY_DB));
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2));
    return fresh;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

module.exports = { loadDB, saveDB, genId, seed };
