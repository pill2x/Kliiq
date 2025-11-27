import { contextBridge, ipcRenderer } from 'electron';

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('installerAPI', {
  // Installation operations
  installApplication: (payload: any) =>
    ipcRenderer.invoke('installer:install', payload),
  
  uninstallApplication: (payload: any) =>
    ipcRenderer.invoke('installer:uninstall', payload),
  
  repairApplication: (payload: any) =>
    ipcRenderer.invoke('installer:repair', payload),
  
  // Detection and info
  detectApplications: () =>
    ipcRenderer.invoke('installer:detect'),
  
  getInstallationDetails: (applicationId: string) =>
    ipcRenderer.invoke('installer:getDetails', applicationId),

  // Progress listeners
  onInstallProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('installer:progress', (event, data) => callback(data));
  },

  onInstallError: (callback: (data: any) => void) => {
    ipcRenderer.on('installer:error', (event, data) => callback(data));
  },

  // Remove listeners
  removeProgressListener: () => {
    ipcRenderer.removeAllListeners('installer:progress');
  },

  removeErrorListener: () => {
    ipcRenderer.removeAllListeners('installer:error');
  },
});

// Type definitions for TypeScript
declare global {
  interface Window {
    installerAPI: {
      installApplication: (payload: any) => Promise<any>;
      uninstallApplication: (payload: any) => Promise<any>;
      repairApplication: (payload: any) => Promise<any>;
      detectApplications: () => Promise<any[]>;
      getInstallationDetails: (applicationId: string) => Promise<any>;
      onInstallProgress: (callback: (data: any) => void) => void;
      onInstallError: (callback: (data: any) => void) => void;
      removeProgressListener: () => void;
      removeErrorListener: () => void;
    };
  }
}
