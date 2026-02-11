# ShiftSync

A comprehensive app to manage work shifts, study sessions, and email for students with part-time jobs. Features recurring schedules, break timers, weather tracking, and productivity analytics.

## Features

**Core Features**
- **Shift Management** - Track work shifts with flexible scheduling
- **Study Sessions** - Organize study time by subject and session type
- **Recurring Schedules** - Set up daily, weekly, or monthly recurring shifts and study sessions with optional end dates
- **Break Timer** - Built-in timer for work/study breaks
- **Email Integration** - Connect and manage your email accounts
- **Weather Dashboard** - Real-time weather information
- **Analytics** - Track productivity and work/study statistics
- **Dark Mode** - Easy on the eyes theme toggle

## Quick Start

### Requirements
- Node.js (v16+)
- SQL Server database

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
   
   **Note:** SQL Server connection string format is used internally

4. **Run the app**
   ```bash
   # Start backend (in backend folder)
   npm run dev

   # Start frontend (in frontend folder)  
   npm start
   ```

5. **Open http://localhost:3000**

## Docker Setup

### Requirements
- Docker
- Docker Compose

### Quick Start with Docker

1. **Clone the project**
   ```bash
   git clone https://github.com/Firoz-Thapa/ShiftSync.git
   cd shiftsync
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Open http://localhost:3000**

### Docker Commands

- **Start services**: `docker-compose up`
- **Start in background**: `docker-compose up -d`
- **Stop services**: `docker-compose down`
- **Rebuild and start**: `docker-compose up --build`
- **View logs**: `docker-compose logs -f`

## Tech Stack

- **Frontend**: React, TypeScript, CSS-in-JS
- **Backend**: Node.js, Express, TypeScript
- **Database**: SQL Server (MSSQL)
- **Charts**: Recharts
- **Authentication**: JWT
- **Containerization**: Docker, Docker Compose

## Project Structure

```
ShiftSync/
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── config/        # Database & environment config
│   │   ├── middleware/    # Auth, validation, security
│   │   └── index.ts       # Express server entry
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components (forms, layout, pages)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   ├── types/         # TypeScript interfaces
│   │   ├── utils/         # Utility functions (recurrence, formatting)
│   │   └── contexts/      # React contexts (auth, theme)
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## API Documentation

### Shift Endpoints
- `GET /api/shifts` - Get all shifts
- `POST /api/shifts` - Create new shift with optional recurrence
- `PUT /api/shifts/:id` - Update shift
- `DELETE /api/shifts/:id` - Delete shift

### Study Session Endpoints
- `GET /api/study-sessions` - Get all study sessions
- `POST /api/study-sessions` - Create session with recurring options (daily/weekly/monthly)
- `PUT /api/study-sessions/:id` - Update session
- `DELETE /api/study-sessions/:id` - Delete session

### Workplace Endpoints
- `GET /api/workplaces` - Get all workplaces
- `POST /api/workplaces` - Create workplace with recurrence support
- `PUT /api/workplaces/:id` - Update workplace
- `DELETE /api/workplaces/:id` - Delete workplace

## License

MIT License - feel free to use this project

