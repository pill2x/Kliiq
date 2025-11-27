'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, LogOut } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              Kliiq
            </Link>
            
            <div className="hidden md:flex gap-8">
              <Link href="/#features" className="text-slate-700 hover:text-primary transition">
                Features
              </Link>
              <Link href="/#packs" className="text-slate-700 hover:text-primary transition">
                Packs
              </Link>
              {session && (
                <Link href="/dashboard" className="text-slate-700 hover:text-primary transition">
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex gap-4 items-center">
            {session ? (
              <>
                <span className="text-slate-700 text-sm">
                  {session.user?.name || session.user?.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-secondary">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden mt-4 space-y-3">
            <Link href="/#features" className="block text-slate-700 py-2">
              Features
            </Link>
            <Link href="/#packs" className="block text-slate-700 py-2">
              Packs
            </Link>
            {session && (
              <Link href="/dashboard" className="block text-slate-700 py-2">
                Dashboard
              </Link>
            )}
            <div className="flex gap-3 pt-3 border-t">
              {session ? (
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <>
                  <Link href="/auth/login" className="btn btn-secondary flex-1">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="btn btn-primary flex-1">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
