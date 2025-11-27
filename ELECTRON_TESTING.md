# Electron Testing Guide for Kliiq Installer Service

## Environment Note
You're running on **Ubuntu (Linux)**, but the installer service was built for **Windows**. Here's what you need to know:

### Current Limitation
- **Windows-Only Features**: Registry integration, .exe/.msi execution
- **On Ubuntu**: The Electron app will launch, but installer operations will fail (as expected)

---

## Two Ways to Test

### Option 1: Test on Windows (Recommended for Full Testing)
```bash
# On a Windows machine:
git clone https://github.com/pill2x/Kliiq.git
cd Kliiq
npm install
npm run dev:electron
```

Then:
1. Login with `test@kliiq.com` / `password123`
2. Click "Uninstall" on Chrome
3. Watch the progress bar go from 0-100% with stages: downloading → preparing → installing → completed
4. Check Windows Registry for `HKLM\Software\Kliiq\Installations\chrome`

### Option 2: Test Web Version (Works on Any Platform)
```bash
# On any platform including Ubuntu:
npm run dev

# Navigate to http://localhost:3000
# Login with test@kliiq.com / password123
# You'll see all UI elements but get "desktop app required" on installer buttons
```

---

## What's Actually Running

### ✅ Working Now
- Next.js dev server
- SQLite database
- Authentication (login/logout)
- Dashboard with 4 sample apps
- All API endpoints
- Electron main process (on Windows)

### ⏳ Requires Windows
- .exe/.msi execution
- Registry read/write
- Process detection
- File system install paths (C:\Program Files\, etc)
- UAC prompts for admin operations

---

## IPC Communication Flow (On Windows)

```
Dashboard UI
    ↓ (Click Uninstall)
React Hook: useInstallerService()
    ↓ (ipcRenderer.invoke)
Preload Script (Context Isolated)
    ↓ (IPC Channel)
Electron Main Process
    ↓ (Event Handler)
InstallerService.executeUninstall()
    ↓ (System Call)
Windows: msiexec.exe / uninstaller.exe
    ↓ (Registry Update)
HKLM\Software\Kliiq\Installations\{appId}
    ↓ (IPC Response)
Dashboard UI: Progress 0→100%
    ↓ (PATCH /api/installations/[id])
Next.js API Route
    ↓ (Database Update)
Prisma: installation.update({ status: 'uninstalled' })
```

---

## To Test Installer Actions on Windows

### Prerequisites
1. Windows 10 or later
2. Node.js 16+
3. Administrator privileges (for UAC)

### Test Steps

#### 1. Start Dev Environment
```bash
npm run dev:electron
```

#### 2. Login
- Email: `test@kliiq.com`
- Password: `password123`
- Expected: Redirects to /dashboard, shows 4 apps

#### 3. Test Uninstall (Chrome)
```
Dashboard → Find Chrome card → Click [Uninstall]
Expected Flow:
  → Progress bar appears
  → Stage: "downloading" (0-30%)
  → Stage: "preparing" (30-50%)
  → Stage: "uninstalling" (50-80%)
  → Verifies removal
  → Stage: "completed" (100%)
  → Card disappears from dashboard
```

#### 4. Test Repair (Docker - marked as "Needs Repair")
```
Dashboard → Find Docker card → Click [Repair]
Expected Flow:
  → Downloads repair package
  → Extracts and prepares
  → Executes repair/reinstall
  → Verifies installation
  → Updates database
  → Status changes to "Installed ✓"
```

#### 5. Verify Registry
```powershell
# In PowerShell with admin privileges:
reg query "HKLM\Software\Kliiq\Installations"

# Should show:
# HKEY_LOCAL_MACHINE\Software\Kliiq\Installations\chrome
#     installPath    REG_SZ    C:\Program Files\Google\Chrome\Application
#     versionId      REG_SZ    v120.0
#     timestamp      REG_SZ    2025-11-27T...
```

---

## File Structure

```
app/electron/
├── main.ts                           # Main process (6 IPC handlers)
├── preload.ts                        # Context-isolated bridge
└── services/
    ├── installer.service.ts          # Install/uninstall/repair
    ├── registry.service.ts           # Windows registry ops
    └── download.service.ts           # Download with progress

hooks/
└── useInstallerService.ts            # React hook for UI

app/api/installations/
└── [id]/route.ts                     # PATCH/DELETE endpoints
```

---

## Troubleshooting

### "Uninstall is only available in the desktop application"
✅ **Normal on Ubuntu/Linux** - requires Windows for system operations

### Progress bar doesn't appear
- Check browser console (F12) for errors
- Verify Electron is running: `tasklist | findstr electron` (Windows)
- Check IPC: DevTools → Console → Search for "installer:"

### Installation hangs at 50%
- Likely UAC prompt (not visible in some environments)
- Try running VS Code as Administrator
- Or run from PowerShell as Admin

### Registry not updating
- Run Electron as Administrator: `runas /user:Administrator "electron ."`
- Or use PowerShell with admin privileges

---

## Next Steps

1. **Test on Windows machine** - Full desktop experience with real installs
2. **Build for distribution** - `npm run build:electron` → creates .exe installer
3. **Add AI recommendations** - Enhance suggestion algorithm
4. **Deploy to production** - Docker + Vercel/AWS

---

## Reference Documentation

- Full Installer Service docs: `INSTALLER_SERVICE.md`
- Architecture: See `TECH_STACK_SUMMARY.md`
- Database schema: `prisma/schema.prisma`

