# Bike Service Center Backend

Production-style Express + MySQL backend for the Bike Service Center Job Management System.

## Features
- JWT authentication with bcrypt password hashing
- Role-based authorization for Super Admin, Manager, Receptionist, Technician, Customer
- REST APIs for auth, customers, jobs, technicians, inventory, billing, reports
- Sequelize ORM models with relationships and constraints
- MySQL schema and seed data
- Pagination, filtering, search support
- Logging middleware and centralized error handler
- Socket.io real-time updates for job status
- Multer file upload for technician photo notes
- Swagger API docs at `/api-docs`

## Project Structure

backend/
- config/
- controllers/
- middlewares/
- models/
- routes/
- services/
- sql/
- utils/
- uploads/
- app.js
- server.js

## Quick Start

1. Copy environment file:
   - `cp .env.example .env` (or create manually on Windows)
2. Configure MySQL credentials in `.env`.
3. Install dependencies:
   - `npm install`
4. Create DB/tables:
   - Run `sql/schema.sql` in MySQL Workbench
5. Seed sample data:
   - Option A: run `sql/seed.sql` in MySQL Workbench
   - Option B: run `npm run seed` for Sequelize seeded data
6. Start server:
   - `npm run dev`

## MySQL Workbench Connection

1. Open MySQL Workbench and create a new connection.
2. Use these values (or your own `.env` values):
   - Hostname: `localhost`
   - Port: `3306`
   - Username: `root`
   - Password: your MySQL password
   - Default Schema: `bike_service_center`
3. Test the Workbench connection and save it.
4. Run `sql/schema.sql` in Workbench to create tables.
5. Optional: run `sql/seed.sql` for sample data.

## Verify Backend DB Connectivity

1. Create `backend/.env` from `.env.example` and set DB credentials.
2. Run:
   - `npm run db:test`
3. If successful, start backend:
   - `npm run dev`

## API Base URL
- `http://localhost:5000/api`

## Health Check
- `GET /health`

## Swagger
- `http://localhost:5000/api-docs`

## Frontend Integration
See:
- `docs/frontend-integration.md`
- `docs/sample-api-responses.md`
