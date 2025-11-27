import { useState, useCallback, useEffect } from 'react';

interface InstallProgress {
  applicationId: string;
  stage: 'downloading' | 'preparing' | 'installing' | 'uninstalling' | 'repairing' | 'completed';
  progress: number;
}

interface InstallError {
  applicationId: string;
  error: string;
}

declare global {
  interface Window {
    installerAPI?: {
      installApplication: (payload: any) => Promise<any>;
      uninstallApplication: (payload: any) => Promise<any>;
      repairApplication: (payload: any) => Promise<any>;
      detectApplications: () => Promise<any[]>;
      getInstallationDetails: (applicationId: string) => Promise<any>;
      onInstallProgress: (callback: (data: InstallProgress) => void) => void;
      onInstallError: (callback: (data: InstallError) => void) => void;
      removeProgressListener: () => void;
      removeErrorListener: () => void;
    };
  }
}

export const useInstallerService = () => {
  const [progress, setProgress] = useState<Map<string, InstallProgress>>(new Map());
  const [errors, setErrors] = useState<Map<string, InstallError>>(new Map());
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    // Check if running in Electron
    setIsElectron(typeof window !== 'undefined' && !!window.installerAPI);

    if (isElectron && window.installerAPI) {
      // Set up listeners
      window.installerAPI.onInstallProgress((data) => {
        setProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.applicationId, data);
          return newMap;
        });

        // Clear error when progress starts
        setErrors((prev) => {
          const newMap = new Map(prev);
          newMap.delete(data.applicationId);
          return newMap;
        });
      });

      window.installerAPI.onInstallError((data) => {
        setErrors((prev) => {
          const newMap = new Map(prev);
          newMap.set(data.applicationId, data);
          return newMap;
        });
      });

      // Cleanup listeners on unmount
      return () => {
        window.installerAPI?.removeProgressListener();
        window.installerAPI?.removeErrorListener();
      };
    }
  }, [isElectron]);

  const installApplication = useCallback(
    async (
      applicationId: string,
      versionId: string,
      downloadUrl: string,
      installationPath: string,
    ) => {
      if (!isElectron || !window.installerAPI) {
        throw new Error('Installer service not available');
      }

      try {
        const result = await window.installerAPI.installApplication({
          applicationId,
          versionId,
          downloadUrl,
          installationPath,
        });

        return result;
      } catch (error) {
        setErrors((prev) => {
          const newMap = new Map(prev);
          newMap.set(applicationId, {
            applicationId,
            error: error instanceof Error ? error.message : 'Installation failed',
          });
          return newMap;
        });
        throw error;
      }
    },
    [isElectron],
  );

  const uninstallApplication = useCallback(
    async (applicationId: string, installPath: string) => {
      if (!isElectron || !window.installerAPI) {
        throw new Error('Installer service not available');
      }

      try {
        const result = await window.installerAPI.uninstallApplication({
          applicationId,
          installPath,
        });

        return result;
      } catch (error) {
        setErrors((prev) => {
          const newMap = new Map(prev);
          newMap.set(applicationId, {
            applicationId,
            error: error instanceof Error ? error.message : 'Uninstallation failed',
          });
          return newMap;
        });
        throw error;
      }
    },
    [isElectron],
  );

  const repairApplication = useCallback(
    async (applicationId: string, installPath: string, downloadUrl: string) => {
      if (!isElectron || !window.installerAPI) {
        throw new Error('Installer service not available');
      }

      try {
        const result = await window.installerAPI.repairApplication({
          applicationId,
          installPath,
          downloadUrl,
        });

        return result;
      } catch (error) {
        setErrors((prev) => {
          const newMap = new Map(prev);
          newMap.set(applicationId, {
            applicationId,
            error: error instanceof Error ? error.message : 'Repair failed',
          });
          return newMap;
        });
        throw error;
      }
    },
    [isElectron],
  );

  const detectApplications = useCallback(async () => {
    if (!isElectron || !window.installerAPI) {
      return [];
    }

    try {
      return await window.installerAPI.detectApplications();
    } catch (error) {
      console.error('Failed to detect applications:', error);
      return [];
    }
  }, [isElectron]);

  const getInstallationDetails = useCallback(
    async (applicationId: string) => {
      if (!isElectron || !window.installerAPI) {
        return null;
      }

      try {
        return await window.installerAPI.getInstallationDetails(applicationId);
      } catch (error) {
        console.error('Failed to get installation details:', error);
        return null;
      }
    },
    [isElectron],
  );

  const getProgress = useCallback((applicationId: string): InstallProgress | undefined => {
    return progress.get(applicationId);
  }, [progress]);

  const getError = useCallback((applicationId: string): InstallError | undefined => {
    return errors.get(applicationId);
  }, [errors]);

  const clearProgress = useCallback((applicationId: string) => {
    setProgress((prev) => {
      const newMap = new Map(prev);
      newMap.delete(applicationId);
      return newMap;
    });
  }, []);

  const clearError = useCallback((applicationId: string) => {
    setErrors((prev) => {
      const newMap = new Map(prev);
      newMap.delete(applicationId);
      return newMap;
    });
  }, []);

  return {
    // Operations
    installApplication,
    uninstallApplication,
    repairApplication,
    detectApplications,
    getInstallationDetails,

    // State queries
    getProgress,
    getError,
    progress,
    errors,

    // Utilities
    clearProgress,
    clearError,
    isElectron,
  };
};
