# Event Access Control System

A hybrid Node.js + Python face recognition system for event access management with real-time verification.

## Features

- **Face Recognition**: Real-time face verification using OpenCV and LBPH algorithm
- **Member Management**: Register and manage event members with photos
- **Dual Check-in Options**: Camera-based or admin-assisted check-in
- **Advanced Search**: Fuzzy search with Greek/Latin character support
- **Hybrid Architecture**: Node.js for API/database, Python for ML operations

## Tech Stack

### Frontend
- React 19 with Vite
- Tailwind CSS v4
- shadcn/ui components
- Lucide icons

### Backend
- **Node.js API** (Port 3001): Express, sql.js, axios
- **Python Microservice** (Port 8000): FastAPI, OpenCV, face_recognition
- **Database**: SQLite

## Architecture

```
React Frontend (5173) → Node.js API (3001) → SQLite DB
                              ↓
                    Python Face API (8000)
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Git

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/AlexBesios/Event-Access-Control.git
cd Event-Access-Control
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Node.js Backend Dependencies

```bash
cd server-node
npm install
cd ..
```

### 4. Setup Python Environment

```bash
cd api
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
cd ..
```

## Running the Application

### Option 1: Start All Services (Windows)

```powershell
.\start-all.ps1
```

### Option 2: Start Services Individually

**Terminal 1 - Python Face Service:**
```bash
cd api
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate    # Linux/Mac
python face_service.py
```

**Terminal 2 - Node.js API:**
```bash
cd server-node
npm start
```

**Terminal 3 - React Frontend:**
```bash
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:5173
- **Node.js API**: http://localhost:3001
- **Python API**: http://localhost:8000

## Project Structure

```
Event-Access-Control/
├── api/                      # Python face recognition service
│   ├── face_service.py      # FastAPI endpoints
│   ├── main.py              # Face recognition logic
│   ├── db.py                # Database manager
│   ├── requirements.txt     # Python dependencies
│   └── venv/                # Python virtual environment
├── server-node/             # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── app.js           # Express app
│   │   └── server.js        # Server entry point
│   └── package.json
├── src/                     # React frontend
│   ├── components/          # React components
│   ├── pages/              # Page components
│   └── main.jsx            # React entry point
├── public/                  # Static assets
├── start-all.ps1           # Startup script
└── package.json            # Frontend dependencies
```

## API Endpoints

### Node.js API (Port 3001)

- `GET /api/members` - Get all members
- `GET /api/members?search=query` - Search members
- `POST /api/members/register` - Register new member
- `DELETE /api/members/:id` - Delete member
- `POST /api/verify` - Verify face (proxies to Python)

### Python API (Port 8000)

- `POST /api/face/register` - Register face data
- `POST /api/face/verify` - Verify face recognition
- `GET /api/face/image/:id` - Get member photo

## Environment Variables

Create `.env` files if needed:

**server-node/.env:**
```env
PORT=3001
PYTHON_API_URL=http://localhost:8000
DATABASE_PATH=../api/event_access.db
```

## Database

SQLite database at `api/event_access.db`:

```sql
CREATE TABLE members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    face_data BLOB NOT NULL,
    face_image BLOB,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Features

### Registration
- Upload photo or capture via webcam
- Automatic face detection and validation
- Face encoding storage

### Verification
- Real-time camera verification
- Admin check-in with search
- Confidence scoring (threshold: 70)

### Search
- Fuzzy matching algorithm
- Greek/Latin character normalization
- Scored results (1000-150 points)

## Development

### Frontend Development
```bash
npm run dev
```

### Backend Development (auto-reload)
```bash
cd server-node
npm run dev
```

### Linting
```bash
npm run lint
```

## Building for Production

```bash
npm run build
```

Outputs to `dist/` directory.

## Troubleshooting

### Python Service Won't Start
- Activate virtual environment first
- Check dependencies: `pip list`
- Verify Python version: `python --version`

### Database Issues
- Path: `api/event_access.db`
- Node.js reloads database on each read

### Images Not Showing
- Ensure Python service is running (port 8000)
- Test: http://localhost:8000/api/face/image/1

## License

MIT

## Author

Alex Besios
