# Kliiq Installer Service Documentation

## Overview

The **Installer Service** is the core backend system that enables Kliiq to manage software installation, updates, repairs, and uninstallation directly on user machines. It consists of three main components running in an Electron process:

1. **InstallerService** - Handles install/uninstall/repair operations
2. **RegistryService** - Manages Windows registry integration and detection
3. **DownloadService** - Handles file downloads with progress tracking

## Architecture

```
┌─────────────────────────────────────────────┐
│  Next.js Web App (UI)                       │
│  /dashboard - Installation Management       │
│  /api/installations - API endpoints         │
└────────────────┬────────────────────────────┘
                 │ IPC Events & RPC Calls
                 ▼
┌─────────────────────────────────────────────┐
│  Electron Main Process                      │
│  ├─ IPC Handlers                            │
│  ├─ InstallerService                        │
│  ├─ RegistryService                         │
│  └─ DownloadService                         │
└────────────────┬────────────────────────────┘
                 │ System Operations
                 ▼
┌─────────────────────────────────────────────┐
│  Windows System                             │
│  ├─ Registry (HKLM\Software\Kliiq)         │
│  ├─ File System (%ProgramFiles%, etc)      │
│  ├─ Process Management (tasklist.exe)      │
│  └─ Installer Execution (.exe, .msi)      │
└─────────────────────────────────────────────┘
```

## Installation Flow

### 1. User Initiates Install

User clicks "Install" on dashboard for an application:

```typescript
const result = await installer.installApplication(
  applicationId,    // e.g., "vs-code"
  versionId,        // e.g., "v1.85.0"
  downloadUrl,      // https://example.com/installer.exe
  installationPath  // C:\Program Files\VS Code
);
```

### 2. Download Phase

**DownloadService** downloads the installer:
- Tracks download progress (0-30%)
- Validates file integrity
- Handles redirects automatically
- Stores in temp directory: `%TEMP%\kliiq-downloads\`

**Events:** `installer:progress { stage: 'downloading', progress: X }`

### 3. Preparation Phase

**InstallerService** prepares the installer:
- If ZIP: Extract to temp directory
- If EXE: Ready for execution
- If MSI: Prepare for msiexec
- Progress: 30-50%

**Events:** `installer:progress { stage: 'preparing', progress: 50 }`

### 4. Installation Phase

**InstallerService** executes installation:
- For EXE: Runs with silent flags `/S /D=path`
- For MSI: Uses `msiexec.exe /i /qn`
- Monitors execution with timeout protection
- Progress: 50-80%

**Events:** `installer:progress { stage: 'installing', progress: X }`

### 5. Verification Phase

**RegistryService** verifies installation:
- Checks if target path exists
- Verifies executable availability
- Checks Windows registry for uninstall entry
- Progress: 80-90%

### 6. Registry Recording

**RegistryService** records installation:
- Path: `HKLM\Software\Kliiq\Installations\{appId}`
- Values: `installPath`, `versionId`, `timestamp`
- Enables future detection and repair

**Events:** `installer:progress { stage: 'completed', progress: 100 }`

### 7. Backend Update

Dashboard sends confirmation to backend:
```typescript
PATCH /api/installations/{id}
Body: { status: 'installed' }
```

Backend records in database:
- Updates `Installation` table
- Records timestamp
- Links to version record

## File Structure

```
app/electron/
├── main.ts                          # Electron main process, IPC handlers
├── preload.ts                       # Context-isolated API bridge
├── services/
│   ├── installer.service.ts         # Install/uninstall/repair logic
│   ├── registry.service.ts          # Windows registry integration
│   └── download.service.ts          # File download with progress

hooks/
└── useInstallerService.ts           # React hook for UI integration

app/api/installations/
└── [id]/route.ts                    # PATCH/DELETE endpoints
```

## IPC Communication

### Main Process → Renderer Events

**Progress Events:**
```typescript
'installer:progress' → {
  applicationId: string,
  stage: 'downloading' | 'preparing' | 'installing' | 'uninstalling' | 'repairing' | 'completed',
  progress: number (0-100)
}
```

**Error Events:**
```typescript
'installer:error' → {
  applicationId: string,
  error: string
}
```

### Renderer → Main Process (IPC Invoke)

**Installation:**
```typescript
ipcRenderer.invoke('installer:install', {
  applicationId: string,
  versionId: string,
  downloadUrl: string,
  installationPath: string
})
```

**Uninstallation:**
```typescript
ipcRenderer.invoke('installer:uninstall', {
  applicationId: string,
  installPath: string
})
```

**Repair:**
```typescript
ipcRenderer.invoke('installer:repair', {
  applicationId: string,
  installPath: string,
  downloadUrl: string
})
```

**Detection:**
```typescript
ipcRenderer.invoke('installer:detect')
// Returns: InstallRecord[]
```

## React Hook Integration

### Setup

```typescript
import { useInstallerService } from '@/hooks/useInstallerService';

export function MyComponent() {
  const installer = useInstallerService();

  // Check if running in Electron
  if (!installer.isElectron) {
    return <p>Desktop app required</p>;
  }
}
```

### Operations

```typescript
// Install
const result = await installer.installApplication(
  'vs-code',
  'v1.85.0',
  'https://example.com/installer.exe',
  'C:\\Program Files\\VS Code'
);

// Uninstall
await installer.uninstallApplication('vs-code', 'C:\\Program Files\\VS Code');

// Repair
await installer.repairApplication('vs-code', 'C:\\Program Files\\VS Code', 'https://example.com/installer.exe');

// Detect
const installed = await installer.detectApplications();
```

### State Queries

```typescript
// Get current progress
const progress = installer.getProgress('vs-code');
if (progress) {
  console.log(`${progress.stage}: ${progress.progress}%`);
}

// Get error
const error = installer.getError('vs-code');
if (error) {
  console.error(error.error);
}

// All progress/errors
installer.progress    // Map<appId, progress>
installer.errors      // Map<appId, error>
```

## Database Integration

### Installation Record (Prisma)

```typescript
model Installation {
  id            String    @id @default(cuid())
  userId        String
  applicationId String
  versionId     String
  status        String    // 'installed', 'broken', 'updating'
  installPath   String?   // Path on user's machine
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user          User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  application   Application @relation(fields: [applicationId], references: [id])
  version       Version    @relation(fields: [versionId], references: [id])
}
```

### API Endpoints

**Update Installation:**
```
PATCH /api/installations/{id}
Headers: { Authorization: Bearer token }
Body: { status: 'installed' | 'broken' | 'updating' | 'uninstalled' }
Response: { success: bool, data: Installation | message: string }
```

**Delete Installation:**
```
DELETE /api/installations/{id}
Headers: { Authorization: Bearer token }
Response: { success: bool, message: string }
```

## Registry Paths

Kliiq stores installation metadata in Windows registry:

```
HKLM\Software\Kliiq\Installations\{applicationId}
├── installPath (REG_SZ)
├── versionId (REG_SZ)
└── timestamp (REG_SZ)
```

This allows:
- Fast detection of installed apps on startup
- Recovery of installation paths for repair
- Cleanup tracking for uninstall

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Download timeout` | Slow/unstable connection | Retry with longer timeout |
| `Installation verification failed` | Installer didn't complete | Retry or manual repair |
| `Uninstallation verification failed` | Files still locked | Restart and retry |
| `Application not found` | App not in database | Add to /api/applications |
| `Installer service not available` | Running in web browser | Requires Electron/desktop app |

### Progress Tracking

Monitor installation status in real-time:

```typescript
installer.onInstallProgress((data) => {
  console.log(`${data.applicationId}: ${data.stage} - ${data.progress}%`);
  // Update UI progress bar
});

installer.onInstallError((data) => {
  console.error(`${data.applicationId}: ${data.error}`);
  // Show error to user
});
```

## Security Considerations

1. **Context Isolation**: Preload script isolates Electron context
2. **IPC Validation**: All parameters validated before system execution
3. **Process Limits**: 5-minute timeout on all operations prevents hanging
4. **Path Validation**: Installation paths validated before use
5. **Registry Permissions**: HKLM operations require admin privileges

## Development

### Run with Electron

```bash
# Start Next.js dev server and Electron simultaneously
npm run dev:electron
```

### Build for Distribution

```bash
# Build Next.js and create Electron installer
npm run build:electron

# Output: dist/Kliiq-x.x.x.exe (NSIS installer)
# Output: dist/Kliiq-x.x.x.exe (Portable)
```

### Testing Installation Flow

```bash
# 1. Start dev server
npm run dev

# 2. In another terminal, launch Electron
electron .

# 3. Navigate to dashboard
# 4. Click Install on any app
# 5. Monitor progress in DevTools Console
```

## Performance

| Operation | Typical Duration |
|-----------|------------------|
| Download (100MB) | 1-5 minutes (network dependent) |
| Preparation | 1-3 seconds |
| Installation | 2-10 seconds |
| Verification | 1-2 seconds |
| **Total** | **3-20 minutes** |

## Future Enhancements

1. **Parallel Downloads** - Download multiple installers simultaneously
2. **Delta Updates** - Only download changed files for updates
3. **Background Installation** - Install while using the app
4. **Rollback Support** - Revert to previous version on failure
5. **Analytics** - Track installation success rates and errors
6. **Cross-Platform** - Extend to macOS and Linux
