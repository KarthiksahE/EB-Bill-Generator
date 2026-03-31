# Smart Electricity Billing System

Full-stack web application with billing, analytics, AI prediction, appliance tracking, alerts, and green energy scoring.

## Tech Stack

- Frontend: React + Tailwind CSS + Recharts
- Backend: Node.js + Express
- Database: MongoDB

## Project Structure

```text
EB Bill Generator/
  frontend/                # React frontend
  backend/                 # Express backend
  database/                # MongoDB Atlas notes
  docs/                    # Logic explanations
```

## Features Implemented

- Authentication (signup/login with JWT)
- Monthly usage entry and state-wise tariff bill calculation
- Bill receipt generation + downloadable PDF
- UPI QR code generation for bill payment
- AI usage prediction (simple linear regression from past months)
- Appliance-wise software-based usage estimation
- Daily/weekly/monthly dashboard charts with trends
- Smart alert engine (threshold, high predicted bill, sudden spike)
- Green Energy Score + efficiency tips

## Setup

### 1. Database (MongoDB Atlas)

1. Create a free cluster in MongoDB Atlas.
2. Create a database user (username/password).
3. In Network Access, allow your current IP (or `0.0.0.0/0` for development only).
4. Copy the Node.js connection string from Atlas.
5. Put it in `backend/.env` as `MONGO_URI`.

Example:

`MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER>.mongodb.net/smart-electricity-billing?retryWrites=true&w=majority&appName=smart-eb`

Important:

- URL-encode special password characters like `@`, `#`, `%`.
- Keep `smart-electricity-billing` as DB name to match this project defaults.

### 2. Backend

```bash
cd backend
npm install
copy .env.example .env
# edit .env and set your Atlas MONGO_URI
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## API Base URL

Frontend uses `${import.meta.env.VITE_API_URL}/api` by default. Update in `frontend/src/services/api.js` if needed.

