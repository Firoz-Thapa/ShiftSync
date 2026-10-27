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
- .NET SDK (10.0+)

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
   dotnet restore

   # Frontend  
   cd ../frontend
   npm install
   ```

3. **Run the app**
   ```bash
   # Start backend
   cd backend
   dotnet run

   # Start frontend
   cd ../frontend
   npm start
   ```

4. **Open http://localhost:3000**

### Gmail and Outlook OAuth

To enable real inbox connections, register OAuth applications with Google and Microsoft Entra ID. Configure their client IDs and secrets as backend environment variables (do not commit secrets):

```text
Email__gmail__ClientId
Email__gmail__ClientSecret
Email__outlook__ClientId
Email__outlook__ClientSecret
Email__CallbackBaseUrl=http://localhost:3001
```

Register these local callback URLs with the providers:

```text
http://localhost:3001/api/emails/callback/gmail
http://localhost:3001/api/emails/callback/outlook
```

The app requests read-only email access. Connected accounts, OAuth tokens, and synced messages currently live in memory and are lost when the backend restarts; this integration is for development until persistent, protected token storage is added.

Weather API access is made by the backend. Configure `Weather__ApiKey` as a backend environment variable; do not use a `REACT_APP_` variable for this key because frontend environment variables are bundled into public browser code.

The Azure deployment workflow requires a `JWT_KEY` repository secret containing a strong signing key. It builds the frontend with the backend App Service URL, configures that frontend's origin for backend CORS, and applies the signing key to the backend App Service.

## Docker Setup

### Requirements
- Docker
- Docker Compose

### Quick Start with Docker

1. **Clone the project**
   ```bash
   git clone https://github.com/yourusername/shiftsync.git
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
- **Backend**: ASP.NET Core, C#
- **Database**: TBD (.NET data layer pending)
- **Charts**: Recharts
- **Authentication**: JWT
- **Containerization**: Docker, Docker Compose

## Project Structure

```
ShiftSync/
├── backend/
│   ├── Controllers/      # API controllers
│   │   ├── EmailsController.cs
│   │   ├── HealthController.cs
│   │   ├── ShiftsController.cs
│   │   └── WorkplacesController.cs
│   ├── Models/           # DTOs and response types
│   ├── Program.cs        # ASP.NET startup
│   └── backend.csproj
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
