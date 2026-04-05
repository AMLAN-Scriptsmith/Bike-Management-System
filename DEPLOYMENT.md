# Production Deployment (Render)

## What this gives you
- Public backend URL (Node + Express)
- Public frontend URL (React static build)
- MySQL-backed runtime via environment variables

## Prerequisites
- GitHub repository with this project pushed
- A MySQL database reachable from Render
- A Render account

## One-time setup
1. Push latest code to GitHub.
2. In Render dashboard, choose `New +` -> `Blueprint`.
3. Select your repository.
4. Render will detect `render.yaml` and create:
   - `bike-service-backend` (web service)
   - `bike-service-frontend` (static site)

## Required backend env vars
Set these in Render backend service:
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_SSL` (`true` for TiDB and many managed MySQL providers)
- `DB_SSL_REJECT_UNAUTHORIZED` (`false` for providers using managed certificates)
- `JWT_SECRET` (auto-generated in blueprint, can override)

Optional (only if used):
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Required frontend env vars
Set these in Render static service:
- `REACT_APP_API_BASE_URL`
   - Example: `https://bike-mangement-system.onrender.com/api`

Optional:
- `REACT_APP_RAZORPAY_KEY_ID`

## CORS alignment (important)
Backend `FRONTEND_URL` must exactly match your deployed frontend origin.

Example:
- `FRONTEND_URL=https://bike-mangement-system.onrender.com`

## Post-deploy verification
1. Backend health: `GET /health`
2. Frontend loads from static URL
3. Login works with seeded users:
   - `admin@test.com / 1234`
   - `manager@test.com / 1234`
   - `reception@test.com / 1234`
   - `tech@test.com / 1234`
   - `customer@test.com / 1234`

## Notes
- First backend startup authenticates, creates tables, and seeds demo data if the database is empty.
- For best reliability, use a managed MySQL provider (not local machine DB).
- If frontend cannot reach API, verify `REACT_APP_API_BASE_URL` and backend `FRONTEND_URL`.
