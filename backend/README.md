# HostelCare Backend

A real Express API for the HostelCare project: authentication, role-based profiles (Student, Warden, Teacher, Admin, Doctor), emergency/SOS handling, and insurance & claims.

Data is stored in a JSON file (`data/db.json`), created automatically on first run. No native database drivers to compile — `npm install` works anywhere. Swap in Postgres/MySQL later by replacing `db.js`; the routes don't need to change.

## Setup

```bash
cd hostelcare-backend
npm install
cp .env.example .env      # edit JWT_SECRET to a long random string
npm start
```

The API runs at `http://localhost:4000` by default. Check it's alive:

```bash
curl http://localhost:4000/api/health
```

## Authentication

Every protected route expects:

```
Authorization: Bearer <token>
```

Get a token from `/api/auth/register` or `/api/auth/login`.

### POST /api/auth/register
```json
{
  "email": "aditi@hostelcare.edu",
  "password": "at-least-6-chars",
  "role": "student",
  "profile": {
    "name": "Aditi Sharma", "course": "B.Tech CSE", "rollNo": "21CS045",
    "section": "B", "hostelName": "Hostel B", "roomNo": "214", "floor": "2"
  }
}
```
`role` is one of `student`, `warden`, `teacher`, `admin`, `doctor`. `profile` fields differ per role (see below). Returns `{ token, user, profile }`.

### POST /api/auth/login
```json
{ "email": "aditi@hostelcare.edu", "password": "at-least-6-chars" }
```

### GET /api/auth/me
Returns the logged-in user's account + profile.

## Profile fields by role

| Role    | Fields |
|---------|--------|
| student | name, course, rollNo, section, hostelName, roomNo, floor |
| warden  | name, hostelName, block, contact |
| teacher | name, department, designation, assignedHostel |
| admin   | name, designation |
| doctor  | name, specialization, hospital |

- `GET /api/profile` — your own profile
- `PUT /api/profile` — update your own profile (body: any subset of your role's fields)
- `GET /api/profile/directory?role=student&hostelName=Hostel%20B` — staff-only lookup (admin, warden, teacher, doctor)

## Emergency / SOS

- `POST /api/emergency` *(student)* — `{ "type": "Injury", "description": "I fell and my leg is hurting badly" }`. Priority is flagged by simple keyword rules (never a diagnosis) and always needs human review.
- `GET /api/emergency` *(warden, doctor, admin)* — list all, optional `?status=`
- `GET /api/emergency/:id` — student sees their own; staff see any
- `PATCH /api/emergency/:id` *(warden, doctor)* — `{ "status": "on_the_way" }`. Status values: `reported → responder_assigned → on_the_way → reached_student → hospital_required → resolved`.

## Insurance

- `GET /api/insurance/policy` *(student)* — own policy
- `POST /api/insurance/policy` *(admin)* — `{ "studentId": "...", "provider": "CampusCare TPA", "memberId": "HC123456", "validFrom": "2026-08-01", "validUntil": "2027-07-31" }`
- `GET /api/insurance/overview` *(admin)* — dashboard counters: studentsCovered, activePolicies, pendingEnrollment, claimsThisYear, pendingClaims, settledClaims
- `GET /api/insurance/hospitals` — network hospital list
- `POST /api/insurance/hospitals` *(admin)* — add a hospital

## Claims

- `POST /api/claims` *(student)* — `{ "hospitalId": "hos_xxx", "description": "..." }`. Auto-creates the 5-document checklist (Student ID, Policy details, Hospital admission, Medical report, Final bill).
- `GET /api/claims` — student: own claims; staff: all claims, optional `?status=`
- `GET /api/claims/:id`
- `POST /api/claims/:id/documents` *(student)* — `{ "type": "Final bill" }` marks a document uploaded
- `PATCH /api/claims/:id/status` *(admin, doctor)* — moves the claim through `submitted → documents_verified → pre_authorization → under_review → approved/rejected → settled → closed`

## Connecting the frontend

In the HostelCare web app, replace the demo `localStorage`-based login/profile logic with real calls:

```js
const API = 'http://localhost:4000/api';

async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  localStorage.setItem('hc_token', data.token); // store the JWT, not the password
  return data;
}

async function authedFetch(path, opts = {}) {
  const token = localStorage.getItem('hc_token');
  return fetch(`${API}${path}`, {
    ...opts,
    headers: { ...opts.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
  });
}
```

## Notes on going to production

- Move `JWT_SECRET` out of source control; use a real secrets manager.
- Replace the JSON file store with a real database once you have concurrent users — the route logic won't need to change much.
- Add rate limiting on `/api/auth/*` and `/api/emergency` (SOS) endpoints.
- File uploads for claim documents (currently just tracked as booleans) need real storage (e.g. S3) with access control, since these are sensitive health/insurance documents.
- Add audit logging for who viewed/changed medical and claim records — required given the sensitivity of this data.
