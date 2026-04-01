# Sample API Responses

## POST /api/auth/login
Request:
```json
{
  "email": "admin@test.com",
  "password": "1234"
}
```
Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "<jwt_token>",
    "user": {
      "id": 1,
      "name": "Super Admin",
      "email": "admin@test.com",
      "role": "Super Admin",
      "phone": "9000000001"
    }
  }
}
```

## POST /api/jobs
Response:
```json
{
  "success": true,
  "message": "Job card created",
  "data": {
    "job": {
      "id": 12,
      "bike_id": 2,
      "service_center_id": 1,
      "status": "Pending",
      "assigned_to": null
    }
  }
}
```

## PATCH /api/jobs/:jobId/status
Response:
```json
{
  "success": true,
  "message": "Job status updated",
  "data": {
    "job": {
      "id": 12,
      "status": "In Progress"
    }
  }
}
```

## GET /api/jobs?page=1&limit=10&status=Assigned&search=KA01
Response:
```json
{
  "success": true,
  "message": "Jobs fetched",
  "data": {
    "meta": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    },
    "rows": [
      {
        "id": 1,
        "status": "Assigned"
      }
    ]
  }
}
```

## POST /api/billing/invoices/:invoiceId/payment
Response:
```json
{
  "success": true,
  "message": "Payment processed (mock)",
  "data": {
    "payment": {
      "id": 7,
      "invoice_id": 3,
      "amount": 2450,
      "method": "UPI",
      "transaction_id": "TXN-1710001234567"
    },
    "invoice": {
      "id": 3,
      "payment_status": "Paid"
    }
  }
}
```
