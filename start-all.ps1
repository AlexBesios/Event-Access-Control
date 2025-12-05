# Start Python Face Recognition Microservice
Write-Host "Starting Python Face Recognition Microservice on port 8000..." -ForegroundColor Green
$apiPath = Join-Path $PSScriptRoot "api"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$apiPath'; .\venv\Scripts\Activate.ps1; python face_service.py"

# Wait a moment for Python service to start
Start-Sleep -Seconds 2

# Start Node.js API Server
Write-Host "Starting Node.js API Server on port 3001..." -ForegroundColor Green
$nodePath = Join-Path $PSScriptRoot "server-node"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$nodePath'; npm start"

# Wait a moment for Node.js service to start
Start-Sleep -Seconds 3

# Start React Frontend
Write-Host "Starting React Frontend on port 5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host "`nAll services started!" -ForegroundColor Cyan
Write-Host "Python API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Node.js API: http://localhost:3001" -ForegroundColor Yellow
Write-Host "React App: http://localhost:5173" -ForegroundColor Yellow
