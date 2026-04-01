# Frontend Integration Guide

## 1. Backend Start
- Start backend on port 5000:
  - `cd backend`
  - `npm install`
  - `npm run dev`

## 2. Frontend API Base URL
Use this in your frontend:
- `http://localhost:5000/api`

Recommended env variable in frontend root (`.env`):
- `REACT_APP_API_BASE_URL=http://localhost:5000/api`

## 3. Authentication Flow
1. Call `POST /api/auth/login` with email/password.
2. Store returned `token`.
3. Send header on protected APIs:
   - `Authorization: Bearer <token>`

## 4. Role-Based UI Routing
Use `user.role` from login response:
- Super Admin
- Manager
- Receptionist
- Technician
- Customer

## 5. Main Endpoints for Existing Frontend
- Auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/profile`
- Jobs:
  - `GET /api/jobs`
  - `POST /api/jobs`
  - `PATCH /api/jobs/:jobId/assign`
  - `PATCH /api/jobs/:jobId/status`
- Inventory:
  - `GET /api/inventory/parts`
  - `POST /api/inventory/parts`
  - `POST /api/inventory/jobs/:jobId/allocate`
- Billing:
  - `POST /api/billing/jobs/:jobId/invoice`
  - `POST /api/billing/invoices/:invoiceId/payment`
- Reports:
  - `GET /api/reports/daily-jobs`
  - `GET /api/reports/revenue`
  - `GET /api/reports/technician-performance`

## 6. Real-Time Job Updates (Socket.io)
Backend emits:
- `job-status-updated`

Payload:
```json
{ "jobId": 12, "status": "In Progress" }
```

## 7. Technician Note Upload (Multer)
Endpoint:
- `POST /api/technicians/jobs/:jobId/notes`
Form data:
- `note` (text)
- `photo` (image file, optional)
