export interface Application {
  id: string;
  name: string;
  description?: string;
  category: string;
  version: string;
  developer?: string;
  website?: string;
  iconUrl?: string;
}

export interface Installation {
  id: string;
  userId: string;
  applicationId: string;
  application: Application;
  status: 'installed' | 'updating' | 'broken' | 'pending';
  installedAt: Date;
  progress: number;
}

export interface Update {
  id: string;
  userId: string;
  applicationId: string;
  fromVersion: string;
  toVersion: string;
  status: 'available' | 'in_progress' | 'completed' | 'failed';
}

export interface Pack {
  id: string;
  name: string;
  description?: string;
  category: string;
  applications: Application[];
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
