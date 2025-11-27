#!/bin/bash
# Wait for Next.js dev server to be ready
echo "Waiting for dev server to start..."
sleep 3

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
  if ! curl -s http://localhost:3001 > /dev/null; then
    echo "Dev server failed to start"
    exit 1
  fi
fi

echo "Dev server ready, starting Electron..."

# Create a simple Electron app entry point
cat > /tmp/electron-main.js << 'EOF'
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

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

// Create menu
const template = [
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
];

if (isDev) {
  template.push({
    label: 'Developer',
    submenu: [
      { label: 'Toggle DevTools', role: 'toggleDevTools' },
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
    ],
  });
}

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
EOF

# Launch Electron
echo "Launching Electron with main process..."
npx electron /tmp/electron-main.js
