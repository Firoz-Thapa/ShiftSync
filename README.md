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

- **Frontend**: React, TypeScript
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Charts**: Recharts

## Project Structure

```
shiftsync/
├── backend/
│   ├── Dockerfile
│   └── ...
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── ...
├── docker-compose.yml
├── SQLQuery1.sql
├── SQLQuery2.sql
└── README.md
```

