# Backend API

## Environment Variables

Create a `.env` file in this directory and define the following variables:

- `PORT` – server port (defaults to `5000`)
- `DB_HOST` – MySQL host
- `DB_NAME` – MySQL database name
- `DB_USER` – MySQL username
- `DB_PASSWORD` – MySQL password
- `JWT_SECRET` – secret key for JWT authentication
- `ALLOWED_ORIGINS` – comma‑separated allowed origins for CORS and WebSocket
- `EMAIL_HOST` – SMTP host for OTP mailer
- `EMAIL_PORT` – SMTP port
- `EMAIL_USER` – SMTP username
- `EMAIL_PASS` – SMTP password
- `FIREBASE_PROJECT_ID` – Firebase project id
- `FIREBASE_CLIENT_EMAIL` – Firebase service account email
- `FIREBASE_PRIVATE_KEY` – Firebase service account private key
- `VAPID_PUBLIC` – Web Push public key
- `VAPID_PRIVATE` – Web Push private key
- `VAPID_SUBJECT` – contact email/URL for Web Push
- `OTP_EXPIRY_MINUTES` – minutes before OTP expires
- `TZ` – timezone for scheduled jobs (defaults to `Asia/Kolkata`)
- `API_BASE_URL` – base URL for generating absolute image links

## GET /students

Fetch class roster for a given year, semester and section.

### Query Parameters
- `year` (optional)
- `semester` (optional)
- `section` (optional)
- `classId` (optional) — class identifier
- `subjectId` (optional) — if provided, year and semester are inferred from the subject

### Response
Returns an array of students including at least `name`, `email` and `roll_number`.

### Authorization
Requires a valid JWT token. Accessible only to non-`student` roles; `student` requests return `403`.

## GET /attendance/student/:id

Fetch attendance statistics for a student.

### Query Parameters
- `startDate` (optional)
- `endDate` (optional)

### Response
```json
{
  "subjectStats": [
    { "subjectId": number, "subjectName": string, "attended": number, "total": number, "percentage": number }
  ],
  "monthlyTrend": [
    { "month": string, "percentage": number }
  ],
  "overall": { "attended": number, "missed": number, "percentage": number },
  "records": [
    { "id": number, "subjectId": number, "subjectName": string, "date": string, "present": boolean, "period": number, "markedBy": number, "markedByName": string }
  ]
}
```

### Authorization
Requires a valid JWT token.

## GET /marks/student/:id/summary

Fetch mark statistics and recent records for a student.

### Query Parameters
- `year` (optional)
- `semester` (optional)

### Response
```json
{
  "subjectStats": [
    { "subjectId": number, "subjectName": string, "obtained": number, "total": number, "percentage": number }
  ],
  "monthlyTrend": [
    { "month": string, "percentage": number }
  ],
  "records": [
    { "id": number, "subjectId": number, "subjectName": string, "type": string, "marks": number, "maxMarks": number, "date": string }
  ],
  "overall": { "obtained": number, "total": number, "percentage": number }
}
```

### Authorization
Requires a valid JWT token.
