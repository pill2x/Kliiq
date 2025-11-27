'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { Trash2, RefreshCw, Wrench, Search, AlertCircle } from 'lucide-react';
import { useInstallerService } from '@/hooks/useInstallerService';

interface Installation {
  id: string;
  applicationName: string;
  version: string;
  status: 'installed' | 'broken' | 'updating';
  installPath?: string;
  installedAt: string;
  applicationId: string;
}

export default function Dashboard() {
  const { status } = useSession();
  const router = useRouter();
  const installer = useInstallerService();
  const [installations, setInstallations] = useState<Installation[]>([]);
  const [filter, setFilter] = useState<'all' | 'installed' | 'updates' | 'broken'>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Fetch installations from API
  useEffect(() => {
    if (status === 'authenticated') {
      fetchInstallations();
    }
  }, [status]);

  const fetchInstallations = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/installations', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch installations');
      }

      const data = await response.json();
      if (data.success) {
        // Map API response to Installation interface
        const mappedData = data.data.map((inst: any) => ({
          id: inst.id,
          applicationName: inst.applicationName,
          version: inst.version,
          status: inst.status === 'broken' ? 'broken' : inst.status === 'updating' ? 'updating' : 'installed',
          installPath: inst.installPath,
          installedAt: inst.installedAt,
          applicationId: inst.applicationId,
        }));
        setInstallations(mappedData);
      } else {
        setError(data.error || 'Failed to fetch installations');
      }
    } catch (err) {
      setError('Error fetching installations. Please try again.');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInstallations = installations
    .filter((app) => {
      if (filter !== 'all' && app.status !== filter) return false;
      if (search && !app.applicationName.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'installed':
        return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">Installed</span>;
      case 'broken':
        return <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">Needs Repair</span>;
      case 'updating':
        return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">Updating</span>;
      default:
        return null;
    }
  };

  const getActionButton = (app: Installation) => {
    const progress = installer.getProgress(app.applicationId);
    const appError = installer.getError(app.applicationId);

    if (appError) {
      return (
        <div className="text-red-600 text-xs font-medium flex items-center gap-2">
          <AlertCircle size={14} />
          {appError.error}
        </div>
      );
    }

    if (progress && progress.progress < 100) {
      return (
        <div className="w-full">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-sm font-medium">{progress.stage}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        </div>
      );
    }

    switch (app.status) {
      case 'installed':
        return (
          <button
            onClick={() => handleUninstall(app)}
            disabled={actionInProgress !== null}
            className="btn bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 size={16} /> Uninstall
          </button>
        );
      case 'broken':
        return (
          <button
            onClick={() => handleRepair(app)}
            disabled={actionInProgress !== null}
            className="btn btn-primary disabled:opacity-50"
          >
            <Wrench size={16} /> Repair
          </button>
        );
      default:
        return null;
    }
  };

  const handleUninstall = async (app: Installation) => {
    if (!installer.isElectron) {
      setError('Uninstall is only available in the desktop application');
      return;
    }

    try {
      setActionInProgress(app.applicationId);
      await installer.uninstallApplication(app.applicationId, app.installPath || '');

      // Update installation status
      await fetch(`/api/installations/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'uninstalled' }),
      });

      setInstallations((prev) => prev.filter((i) => i.id !== app.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uninstall failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRepair = async (app: Installation) => {
    if (!installer.isElectron) {
      setError('Repair is only available in the desktop application');
      return;
    }

    try {
      setActionInProgress(app.applicationId);

      // Get the download URL from API
      const response = await fetch(`/api/applications?name=${app.applicationName}`);
      const appData = await response.json();

      if (!appData.success || appData.data.length === 0) {
        throw new Error('Application not found');
      }

      const downloadUrl = appData.data[0].latestVersion?.downloadUrl;
      if (!downloadUrl) {
        throw new Error('Download URL not available');
      }

      await installer.repairApplication(
        app.applicationId,
        app.installPath || '',
        downloadUrl,
      );

      // Update installation status
      await fetch(`/api/installations/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'installed' }),
      });

      setInstallations((prev) =>
        prev.map((i) =>
          i.id === app.id ? { ...i, status: 'installed' } : i,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Repair failed');
    } finally {
      setActionInProgress(null);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-primary">
        <Navbar />
        <div className="pt-32 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-slate-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>

      <Navbar />
      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-8">
            <h1 className="section-title mb-2">Software Dashboard</h1>
            <p className="section-subtitle">Manage all your installed applications</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search applications..."
                  className="input pl-10 w-full"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {(['all', 'installed', 'broken'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === f
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Apps Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading applications...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInstallations.length > 0 ? (
                filteredInstallations.map((app: Installation) => (
                  <div key={app.id} className="card">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{app.applicationName}</h3>
                        <p className="text-sm text-slate-600">v{app.version}</p>
                      </div>
                    </div>

                    <div className="mb-4">{getStatusBadge(app.status)}</div>

                    <p className="text-xs text-slate-500 mb-4">
                      {new Date(app.installedAt).toLocaleDateString()}
                    </p>

                    <div className="flex gap-2">{getActionButton(app)}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-slate-600">No applications found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
