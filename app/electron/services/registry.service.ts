import { execSync, execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import * as Registry from 'winreg';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

interface InstallRecord {
  applicationId: string;
  versionId: string;
  installPath: string;
  timestamp: string;
}

export class RegistryService {
  private registryPath = 'HKLM\\Software\\Kliiq\\Installations';
  private kliiqRegistryKey = new Registry({
    hive: Registry.HKLM,
    key: '\\Software\\Kliiq\\Installations',
  });

  async recordInstallation(record: InstallRecord): Promise<void> {
    try {
      // Store in Windows registry for persistence
      const regPath = `HKLM\\Software\\Kliiq\\Installations\\${record.applicationId}`;

      // Set registry values
      execSync(
        `reg add "${regPath}" /v "installPath" /d "${record.installPath}" /f`,
        { windowsHide: true },
      );
      execSync(`reg add "${regPath}" /v "versionId" /d "${record.versionId}" /f`, {
        windowsHide: true,
      });
      execSync(`reg add "${regPath}" /v "timestamp" /d "${record.timestamp}" /f`, {
        windowsHide: true,
      });
    } catch (error) {
      throw new Error(
        `Failed to record installation: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async removeInstallation(applicationId: string): Promise<void> {
    try {
      const regPath = `HKLM\\Software\\Kliiq\\Installations\\${applicationId}`;
      execSync(`reg delete "${regPath}" /f`, { windowsHide: true });
    } catch (error) {
      throw new Error(
        `Failed to remove installation record: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getInstallationDetails(applicationId: string): Promise<InstallRecord | null> {
    try {
      const regPath = `HKLM\\Software\\Kliiq\\Installations\\${applicationId}`;

      // Query registry
      const output = execSync(`reg query "${regPath}" /s`, {
        encoding: 'utf-8',
        windowsHide: true,
      });

      if (output.includes('ERROR')) {
        return null;
      }

      // Parse registry output
      const lines = output.split('\n');
      const record: Partial<InstallRecord> = {
        applicationId,
      };

      lines.forEach((line) => {
        const match = line.match(/\s+(\w+)\s+REG_SZ\s+(.*)/);
        if (match) {
          const [, key, value] = match;
          if (key === 'installPath') record.installPath = value;
          if (key === 'versionId') record.versionId = value;
          if (key === 'timestamp') record.timestamp = value;
        }
      });

      return record.installPath ? (record as InstallRecord) : null;
    } catch (error) {
      console.error('Failed to get installation details:', error);
      return null;
    }
  }

  async verifyInstallation(installPath: string): Promise<boolean> {
    try {
      // Check if main executable exists or key files are present
      const stat = await fs.stat(installPath);
      return stat.isDirectory() || stat.isFile();
    } catch {
      return false;
    }
  }

  async verifyUninstallation(installPath: string): Promise<boolean> {
    try {
      // Verify that the installation path no longer exists
      await fs.access(installPath);
      return false; // Path still exists, uninstall failed
    } catch {
      return true; // Path is gone, uninstall successful
    }
  }

  async detectInstalledApplications(): Promise<InstallRecord[]> {
    try {
      const installed: InstallRecord[] = [];

      // Check Kliiq registry
      try {
        const output = execSync(`reg query "HKLM\\Software\\Kliiq\\Installations"`, {
          encoding: 'utf-8',
          windowsHide: true,
        });

        const lines = output.split('\n');
        const appIds = new Set<string>();

        lines.forEach((line) => {
          const match = line.match(/HKLM\\Software\\Kliiq\\Installations\\([^\s]+)/);
          if (match) {
            appIds.add(match[1]);
          }
        });

        // Get details for each app
        for (const appId of appIds) {
          const details = await this.getInstallationDetails(appId);
          if (details) {
            installed.push(details);
          }
        }
      } catch (e) {
        // Registry path might not exist yet
      }

      // Also check common install locations
      await this.scanCommonLocations(installed);

      return installed;
    } catch (error) {
      console.error('Failed to detect installations:', error);
      return [];
    }
  }

  private async scanCommonLocations(installed: InstallRecord[]): Promise<void> {
    const commonPaths = [
      'C:\\Program Files\\',
      'C:\\Program Files (x86)\\',
      '%LOCALAPPDATA%\\Programs\\',
      '%APPDATA%\\',
    ];

    // Common executable names to look for
    const commonApps = [
      { name: 'vs-code', exe: 'Code.exe' },
      { name: 'chrome', exe: 'chrome.exe' },
      { name: 'firefox', exe: 'firefox.exe' },
      { name: 'git', exe: 'git.exe' },
      { name: 'nodejs', exe: 'node.exe' },
    ];

    for (const appInfo of commonApps) {
      for (const basePath of commonPaths) {
        const expandedPath = this.expandPath(basePath);
        const possiblePaths = [
          path.join(expandedPath, appInfo.name),
          path.join(expandedPath, appInfo.name.replace('-', ' ')),
        ];

        for (const appPath of possiblePaths) {
          try {
            const exePath = path.join(appPath, appInfo.exe);
            await fs.access(exePath);

            // Check if not already in our list
            if (!installed.some((i) => i.installPath === appPath)) {
              installed.push({
                applicationId: appInfo.name,
                versionId: 'unknown',
                installPath: appPath,
                timestamp: new Date().toISOString(),
              });
            }

            break;
          } catch {
            // Path doesn't exist, continue
          }
        }
      }
    }
  }

  private expandPath(envPath: string): string {
    let expanded = envPath;

    if (expanded.includes('%APPDATA%')) {
      expanded = expanded.replace('%APPDATA%', process.env.APPDATA || '');
    }

    if (expanded.includes('%LOCALAPPDATA%')) {
      expanded = expanded.replace('%LOCALAPPDATA%', process.env.LOCALAPPDATA || '');
    }

    return expanded;
  }

  async isApplicationRunning(applicationId: string): Promise<boolean> {
    try {
      // Check if process is running using tasklist
      const { stdout } = await execFileAsync('tasklist.exe', {
        windowsHide: true,
      });

      // This is a simplified check - in production, map appId to process names
      const processNames = this.getProcessNames(applicationId);
      return processNames.some((name) => stdout.includes(name));
    } catch {
      return false;
    }
  }

  private getProcessNames(applicationId: string): string[] {
    const processMap: Record<string, string[]> = {
      'vs-code': ['Code.exe'],
      chrome: ['chrome.exe'],
      firefox: ['firefox.exe'],
      git: ['git.exe'],
      nodejs: ['node.exe'],
      slack: ['slack.exe'],
      docker: ['Docker.exe', 'DockerDesktop.exe'],
    };

    return processMap[applicationId] || [];
  }
}
