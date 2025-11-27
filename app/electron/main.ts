import { app, BrowserWindow, ipcMain, Menu } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import { InstallerService } from './services/installer.service';
import { RegistryService } from './services/registry.service';
import { DownloadService } from './services/download.service';

let mainWindow: BrowserWindow | null = null;
const installerService = new InstallerService();
const registryService = new RegistryService();
const downloadService = new DownloadService();

// Create application window
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.ts'),
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../public/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// ============================================
// IPC HANDLERS FOR INSTALLER OPERATIONS
// ============================================

// Install application
ipcMain.handle('installer:install', async (event, payload) => {
  const { applicationId, versionId, downloadUrl, installationPath } = payload;

  try {
    // Step 1: Download installer
    const installerPath = await downloadService.downloadFile(downloadUrl, {
      onProgress: (progress) => {
        mainWindow?.webContents.send('installer:progress', {
          stage: 'downloading',
          progress,
          applicationId,
        });
      },
    });

    // Step 2: Extract/prepare installer
    const preparedPath = await installerService.prepareInstaller(installerPath);

    mainWindow?.webContents.send('installer:progress', {
      stage: 'preparing',
      progress: 100,
      applicationId,
    });

    // Step 3: Execute installation
    const result = await installerService.executeInstall(preparedPath, installationPath, {
      onProgress: (progress) => {
        mainWindow?.webContents.send('installer:progress', {
          stage: 'installing',
          progress,
          applicationId,
        });
      },
    });

    // Step 4: Verify installation
    const verified = await registryService.verifyInstallation(result.installPath);

    if (!verified) {
      throw new Error('Installation verification failed');
    }

    // Step 5: Record in registry
    await registryService.recordInstallation({
      applicationId,
      versionId,
      installPath: result.installPath,
      timestamp: new Date().toISOString(),
    });

    mainWindow?.webContents.send('installer:progress', {
      stage: 'completed',
      progress: 100,
      applicationId,
    });

    return {
      success: true,
      installPath: result.installPath,
      versionId,
    };
  } catch (error) {
    mainWindow?.webContents.send('installer:error', {
      applicationId,
      error: error instanceof Error ? error.message : 'Installation failed',
    });
    throw error;
  }
});

// Uninstall application
ipcMain.handle('installer:uninstall', async (event, payload) => {
  const { applicationId, installPath } = payload;

  try {
    mainWindow?.webContents.send('installer:progress', {
      stage: 'uninstalling',
      progress: 0,
      applicationId,
    });

    // Execute uninstallation
    const result = await installerService.executeUninstall(installPath, {
      onProgress: (progress) => {
        mainWindow?.webContents.send('installer:progress', {
          stage: 'uninstalling',
          progress,
          applicationId,
        });
      },
    });

    // Verify removal
    const verified = await registryService.verifyUninstallation(installPath);

    if (!verified) {
      throw new Error('Uninstallation verification failed');
    }

    // Remove from registry
    await registryService.removeInstallation(applicationId);

    mainWindow?.webContents.send('installer:progress', {
      stage: 'completed',
      progress: 100,
      applicationId,
    });

    return { success: true };
  } catch (error) {
    mainWindow?.webContents.send('installer:error', {
      applicationId,
      error: error instanceof Error ? error.message : 'Uninstallation failed',
    });
    throw error;
  }
});

// Repair installation
ipcMain.handle('installer:repair', async (event, payload) => {
  const { applicationId, installPath, downloadUrl } = payload;

  try {
    mainWindow?.webContents.send('installer:progress', {
      stage: 'repairing',
      progress: 0,
      applicationId,
    });

    // Download repair package
    const repairPath = await downloadService.downloadFile(downloadUrl, {
      onProgress: (progress) => {
        mainWindow?.webContents.send('installer:progress', {
          stage: 'downloading',
          progress,
          applicationId,
        });
      },
    });

    // Execute repair
    const result = await installerService.executeRepair(repairPath, installPath, {
      onProgress: (progress) => {
        mainWindow?.webContents.send('installer:progress', {
          stage: 'repairing',
          progress,
          applicationId,
        });
      },
    });

    // Verify repair
    const verified = await registryService.verifyInstallation(installPath);

    if (!verified) {
      throw new Error('Repair verification failed');
    }

    mainWindow?.webContents.send('installer:progress', {
      stage: 'completed',
      progress: 100,
      applicationId,
    });

    return { success: true, repaired: true };
  } catch (error) {
    mainWindow?.webContents.send('installer:error', {
      applicationId,
      error: error instanceof Error ? error.message : 'Repair failed',
    });
    throw error;
  }
});

// Detect installed applications
ipcMain.handle('installer:detect', async (event) => {
  try {
    const installed = await registryService.detectInstalledApplications();
    return installed;
  } catch (error) {
    console.error('Detection error:', error);
    return [];
  }
});

// Get installation details
ipcMain.handle('installer:getDetails', async (event, applicationId: string) => {
  try {
    const details = await registryService.getInstallationDetails(applicationId);
    return details;
  } catch (error) {
    console.error('Error getting installation details:', error);
    return null;
  }
});

// Set up application menu
const createMenu = () => {
  const template: any[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
      ],
    },
    ...(isDev
      ? [
          {
            label: 'Developer',
            submenu: [
              { label: 'Toggle DevTools', role: 'toggleDevTools' },
              { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
            ],
          },
        ]
      : []),
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

app.on('ready', createMenu);
