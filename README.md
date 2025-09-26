# ShiftSync

A simple app to manage work shifts and study sessions for students with part-time jobs.

## Quick Start

### Requirements
- Node.js (v16+)
- MySQL database

### Setup

1. **Clone the project**
   ```bash
   git clone https://github.com/yourusername/shiftsync.git
   cd shiftsync
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend  
   cd ../frontend
   npm install
   ```

3. **Environment setup**
   
   Create `.env` in the backend folder:
   ```env
   PORT=3001
   DB_HOST=localhost
   DB_NAME=shiftsync
   DB_USER=your_username
   DB_PASSWORD=your_password
   JWT_SECRET=your_secret_key
   ```

4. **Run the app**
   ```bash
   # Start backend (in backend folder)
   npm run dev

   # Start frontend (in frontend folder)  
   npm start
   ```

5. **Open http://localhost:3000**

## Tech Stack

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Charts**: Recharts

## Project Structure

```
shiftsync/
├── backend/          
├── frontend/         
└── README.md
```

