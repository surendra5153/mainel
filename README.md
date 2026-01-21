# Skill Swap Project

## Overview
Skill Swap is a MERN stack application designed to facilitate skill exchange between users. It features real-time chat, video calls, mentorship matching, and AI-powered recommendations.

## Structure
- **backend/**: Node.js/Express server.
    - **config/**: Database and authentication configuration.
    - **controllers/**: Business logic for routes.
    - **models/**: Mongoose schemas.
    - **routes/**: API endpoints.
    - **scripts/**: Utility scripts for database seeding and maintenance.
- **frontend/**: React application (Vite).
    - **src/**: React components and logic.

## Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

## Setup & Running

### Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`.
   - Update `MONGO_URI` and other secrets.
4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.

## Recent Improvements
- **Standardized Imports**: Fixed casing inconsistencies in model imports (`User.js`, `Session.js`) to ensure cross-platform compatibility.
- **Code Cleanup**: Removed unused files (logs, temp scripts) and duplicated logic in the server entry point.
- **Configuration**: Updated Vite configuration to proxy API requests to the backend, resolving potential CORS issues during development.
- **Performance**: Optimized server startup by organizing `require` calls.

## Testing
- Integration tests can be run using the scripts in `backend/scripts/`.
- Frontend tests (Playwright) are configured in `frontend/`.

## License
ISC
