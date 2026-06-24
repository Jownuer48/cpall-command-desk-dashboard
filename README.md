# CPALL Command Center Desk Status Dashboard

Read-only dashboard for displaying computer desk booking status.

- Backend: ASP.NET Core 9 Web API
- Frontend: React + Vite + TypeScript
- Styling: plain CSS
- Current data source: mock JSON provider
- Deployment target: LAN-only

## API

- `GET /api/health`
- `GET /api/desk-status`

The mock provider includes seats `CC-01` through `CC-24`, grouped across Command Center A, Command Center B, Monitoring Zone, and Supervisor Zone.

## UI Theme

The dashboard uses the CPALL logo and CPALL-inspired colors: blue for the primary brand color, red/orange for booked desks, green for available desks, and bright white/light gray dashboard surfaces.

Logo path:

```text
frontend/public/cpalllogo.png
```

## Development mode

Run the backend API at `http://localhost:5000`:

```powershell
cd backend
dotnet run
```

Run the frontend dev server at `http://localhost:5173`:

```powershell
cd frontend
npm install
npm run dev
```

For frontend development, set `VITE_API_BASE_URL` to the backend URL. See `frontend/.env.example`.

## LAN production mode

In LAN production, users open one URL only:

```text
http://SERVER_LAN_IP:5000
```

The Vite dev server is not used in production. ASP.NET Core serves the built React files from `backend/wwwroot`, and the frontend calls the API with relative paths such as `/api/desk-status`.

Build and publish manually:

```powershell
cd frontend
npm install
npm run build

cd ..
New-Item -ItemType Directory -Force backend\wwwroot
Copy-Item -Recurse -Force frontend\dist\* backend\wwwroot\

cd backend
dotnet publish -c Release -o publish
dotnet .\publish\Cpall.CommandCenter.Api.dll --urls http://0.0.0.0:5000
```

Or run the helper script from the repository root:

```powershell
.\scripts\publish-lan.ps1
```

Open Windows Firewall for LAN users:

```powershell
netsh advfirewall firewall add rule name="CPALL Desk Dashboard 5000" dir=in action=allow protocol=TCP localport=5000
```

Production endpoints:

- Dashboard: `http://SERVER_LAN_IP:5000`
- Health: `http://SERVER_LAN_IP:5000/api/health`
- Desk status: `http://SERVER_LAN_IP:5000/api/desk-status`


