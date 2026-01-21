# Copilot Instructions for This Project

## Project Overview
This project consists of a **backend** and a **frontend**:

- **Backend**: Node.js/Express application located in `backend/`.
  - Handles authentication, database interactions, and API endpoints.
  - Key directories:
    - `backend/models/`: Defines database models (e.g., `Category.js`, `Session.js`).
    - `backend/controllers/`: Contains logic for handling API requests (e.g., `authController.js`, `skillController.js`).
    - `backend/routes/`: Defines API routes (e.g., `auth.js`, `skills.js`).
    - `backend/utils/`: Utility functions (e.g., `generateToken.js`, `tokenService.js`).
    - `backend/scripts/`: Scripts for database seeding (e.g., `seedDatabase.js`).

- **Frontend**: React application located in `frontend/my-app/`.
  - Built with Vite and Tailwind CSS.
  - Key directories:
    - `frontend/my-app/src/components/`: Reusable UI components (e.g., `NavBar.jsx`, `SkillCard.jsx`).
    - `frontend/my-app/src/pages/`: Page-level components (e.g., `Dashboard.jsx`, `SkillsBrowse.jsx`).
    - `frontend/my-app/src/api/`: API interaction logic (e.g., `auth.js`, `skills.js`).
    - `frontend/my-app/src/store/`: State management (e.g., `authStore.js`, `skillsStore.js`).

## Developer Workflows

### Running the Backend
1. Navigate to the `backend/` directory.
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the server:
   ```powershell
   npm start
   ```
4. The backend runs on `http://localhost:5000` by default.

### Running the Frontend
1. Ensure the backend is running on `http://localhost:5000` or set `VITE_API_URL` in your environment.
2. Navigate to the `frontend/my-app/` directory.
3. Install dependencies and start the development server:
   ```powershell
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

### Seeding the Database
1. Navigate to the `backend/scripts/` directory.
2. Run the `seedDatabase.js` script:
   ```powershell
   node seedDatabase.js
   ```

## Project-Specific Conventions
- **API Design**: RESTful endpoints are defined in `backend/routes/` and implemented in `backend/controllers/`.
- **Authentication**: Managed using Passport.js (`backend/config/passport.js`). Tokens are generated in `backend/utils/generateToken.js`.
- **Frontend State Management**: Uses custom stores in `frontend/my-app/src/store/`.
- **Styling**: Tailwind CSS is configured in `frontend/my-app/tailwind.config.js`.

## Integration Points
- **Frontend-Backend Communication**:
  - The frontend interacts with the backend via API calls defined in `frontend/my-app/src/api/`.
  - API calls include authentication headers and use `credentials: 'include'` for cookies.
- **Database**:
  - Models are defined in `backend/models/`.
  - Database connection is configured in `backend/config/db.js`.

## Examples
- **Adding a New API Endpoint**:
  1. Define the route in `backend/routes/`.
  2. Implement the logic in a corresponding controller in `backend/controllers/`.
  3. Update the frontend API logic in `frontend/my-app/src/api/` if needed.

- **Creating a New Page**:
  1. Add a new component in `frontend/my-app/src/pages/`.
  2. Update the routing in `frontend/my-app/src/App.jsx`.

---

This guide is a starting point. Update it as the project evolves.