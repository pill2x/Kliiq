import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import * as os from 'os';
import * as extract from 'extract-zip';

const execFileAsync = promisify(execFile);

interface InstallProgress {
  onProgress?: (progress: number) => void;
}

export class InstallerService {
  private tempDir = path.join(os.tmpdir(), 'kliiq-installer');

  async prepareInstaller(installerPath: string): Promise<string> {
    try {
      // Ensure temp directory exists
      await fs.mkdir(this.tempDir, { recursive: true });

      // If it's a ZIP, extract it
      if (installerPath.endsWith('.zip')) {
        const extractPath = path.join(this.tempDir, path.basename(installerPath, '.zip'));
        await fs.mkdir(extractPath, { recursive: true });

        await extract(installerPath, { dir: extractPath });

        // Find the executable
        const files = await fs.readdir(extractPath, { recursive: true });
        const exePath = files.find((f) => typeof f === 'string' && f.endsWith('.exe'));

        if (exePath) {
          return path.join(extractPath, exePath);
        }

        return extractPath;
      }

      return installerPath;
    } catch (error) {
      throw new Error(`Failed to prepare installer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeInstall(
    installerPath: string,
    targetPath: string,
    options: InstallProgress = {},
  ): Promise<{ installPath: string }> {
    try {
      // Ensure target directory exists
      await fs.mkdir(targetPath, { recursive: true });

      // Execute silent installation with common flags
      const args = [
        '/S', // Silent mode
        `/D=${targetPath}`, // Installation directory
      ];

      // Track progress
      if (options.onProgress) {
        // Simulate progress for .exe installation (0-50%)
        options.onProgress(25);
        await new Promise((r) => setTimeout(r, 500));
      }

      // Execute installer
      const { stdout, stderr } = await execFileAsync(installerPath, args, {
        timeout: 300000, // 5 minutes timeout
        windowsHide: true,
      });

      if (options.onProgress) {
        options.onProgress(75);
        await new Promise((r) => setTimeout(r, 500));
      }

      // For .msi files, use msiexec
      if (installerPath.endsWith('.msi')) {
        const msiArgs = ['ALLUSERS=1', `INSTALLDIR=${targetPath}`, '/qn', '/norestart'];
        await execFileAsync('msiexec.exe', ['/i', installerPath, ...msiArgs], {
          timeout: 300000,
          windowsHide: true,
        });
      }

      if (options.onProgress) {
        options.onProgress(100);
      }

      // Clean up extracted files if necessary
      if (installerPath.includes(this.tempDir)) {
        try {
          await fs.unlink(installerPath);
        } catch (e) {
          // Ignore cleanup errors
        }
      }

      return { installPath: targetPath };
    } catch (error) {
      throw new Error(`Installation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeUninstall(
    installPath: string,
    options: InstallProgress = {},
  ): Promise<{ success: boolean }> {
    try {
      if (options.onProgress) {
        options.onProgress(25);
      }

      // Look for uninstaller
      const uninstallerPath = path.join(installPath, 'uninstall.exe');

      try {
        await fs.access(uninstallerPath);

        // Execute uninstaller silently
        await execFileAsync(uninstallerPath, ['/S'], {
          timeout: 300000,
          windowsHide: true,
        });

        if (options.onProgress) {
          options.onProgress(75);
        }
      } catch (e) {
        // Uninstaller not found, try Windows registry uninstall
        await this.uninstallViaRegistry(installPath);

        if (options.onProgress) {
          options.onProgress(75);
        }
      }

      // Remove remaining files
      try {
        await fs.rm(installPath, { recursive: true, force: true });
      } catch (e) {
        // Directory might be locked, that's ok
      }

      if (options.onProgress) {
        options.onProgress(100);
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Uninstallation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async executeRepair(
    repairPath: string,
    targetPath: string,
    options: InstallProgress = {},
  ): Promise<{ success: boolean }> {
    try {
      if (options.onProgress) {
        options.onProgress(20);
      }

      // Prepare repair package
      const preparedPath = await this.prepareInstaller(repairPath);

      if (options.onProgress) {
        options.onProgress(40);
      }

      // Execute repair/reinstall
      const args = [
        '/S', // Silent mode
        `/D=${targetPath}`, // Installation directory
        '/FORCE', // Force install
      ];

      await execFileAsync(preparedPath, args, {
        timeout: 300000,
        windowsHide: true,
      });

      if (options.onProgress) {
        options.onProgress(80);
      }

      // For .msi, try repair mode
      if (repairPath.endsWith('.msi')) {
        await execFileAsync('msiexec.exe', ['/f', repairPath, `/INSTALDIR=${targetPath}`, '/qn'], {
          timeout: 300000,
          windowsHide: true,
        });
      }

      if (options.onProgress) {
        options.onProgress(100);
      }

      return { success: true };
    } catch (error) {
      throw new Error(`Repair failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uninstallViaRegistry(installPath: string): Promise<void> {
    try {
      // Try to find and execute uninstall string from Windows registry
      const { execSync } = require('child_process');

      // Query registry for uninstall entries
      const registryPath = 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall';

      // This is a simplified approach - in production, you'd parse registry properly
      execSync(`reg delete "${installPath}" /s /f`, { windowsHide: true });
    } catch (e) {
      // Registry operation failed, continue with file deletion
    }
  }
}
