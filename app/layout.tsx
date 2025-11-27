import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './providers';

export const metadata: Metadata = {
  title: 'Kliiq - Intelligent Software Management',
  description: 'One-click software installation, updates, and management for your entire PC. From installation to repair, Kliiq is the unified control center for every PC user.',
  keywords: ['software management', 'installer', 'updates', 'PC maintenance', 'software repair'],
  authors: [{ name: 'Kliiq Team' }],
  openGraph: {
    title: 'Kliiq',
    description: 'Intelligent Software Management Platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
