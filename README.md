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

## Run locally

Backend:

```powershell
cd backend
dotnet run
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

For frontend development, set `VITE_API_BASE_URL` to the backend URL. See `frontend/.env.example`.



