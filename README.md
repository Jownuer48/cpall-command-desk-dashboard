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
- `GET /api/department-usage-ranking`

The mock provider includes 12 seats, `A01` through `A12`, in one Command Center layout.

## SharePoint data source

The backend can read bookings from the SharePoint list below through Microsoft Graph:

```text
https://cpallgroup.sharepoint.com/sites/MST-CCTV-Booking-System/Lists/CCTVBookings_DB_tblBooks/AllItems.aspx
```

Create `backend/appsettings.Development.local.json` and keep the real secret there:

Use `backend/appsettings.Development.local.json.example` as the starting point.

```json
{
  "SharePoint": {
    "Enabled": true,
    "TenantId": "YOUR_TENANT_ID",
    "ClientId": "YOUR_APP_CLIENT_ID",
    "ClientSecret": "YOUR_APP_CLIENT_SECRET",
    "SeatIdField": "SeatId",
    "BookedByField": "BookedBy",
    "DepartmentField": "Department",
    "StartTimeField": "StartTime",
    "EndTimeField": "EndTime",
    "PurposeField": "Purpose",
    "NoteField": "Note"
  }
}
```

The Azure app registration needs Microsoft Graph application permission that can read the SharePoint list, such as `Sites.Read.All`, with admin consent. If the list uses different internal column names, update the field names in the local settings file.

When the SharePoint settings are present, the backend automatically uses the SharePoint provider; otherwise it falls back to mock data.

The dashboard calls the backend every 30 seconds. The SharePoint provider also caches list data for 30 seconds before reading SharePoint again.

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

The frontend dev server proxies `/api` requests to `http://localhost:5000`, so it can run without any extra env file as long as the backend is running.

If you prefer to point the frontend directly at a backend URL, see `frontend/.env.example`.

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


