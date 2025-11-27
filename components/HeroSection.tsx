'use client';

import Link from 'next/link';
import { Download, Play } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="bg-gradient-primary text-white py-20 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Install. Update. Manage. <span className="text-accent">Repair.</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              One intelligent tool for the full software lifecycle. No more fragmented, outdated, and painful installations.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="#packs" className="btn btn-accent">
                <Download size={20} />
                Start Installing
              </Link>
              <Link href="#features" className="btn bg-white text-primary hover:bg-white/90">
                <Play size={20} />
                See How It Works
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: '💻', name: 'VS Code', status: 'installing', progress: 75 },
              { icon: '🌐', name: 'Chrome', status: 'installed', progress: 100 },
              { icon: '💬', name: 'Slack', status: 'updating', progress: 45 },
              { icon: '🎨', name: 'Figma', status: 'installed', progress: 100 },
            ].map((app) => (
              <div key={app.name} className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <div className="text-4xl mb-3">{app.icon}</div>
                <p className="font-semibold text-sm mb-3">{app.name}</p>
                <div className="w-full bg-white/20 rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-accent h-full transition-all"
                    style={{ width: `${app.progress}%` }}
                  />
                </div>
                {app.status === 'installed' && (
                  <div className="mt-3 text-xs font-semibold">✓ Installed</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
