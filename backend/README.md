# Backend API

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
