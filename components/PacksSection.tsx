'use client';

import { Code, Palette, Gamepad2, Download } from 'lucide-react';

const packs = [
  {
    id: 'dev',
    name: 'Developer Pack',
    icon: Code,
    description: 'Essential tools for modern development',
    apps: ['VS Code', 'Git', 'Node.js', 'Docker', 'PostgreSQL', 'Python'],
  },
  {
    id: 'designer',
    name: 'Designer Pack',
    icon: Palette,
    description: 'Creative tools for designers and artists',
    apps: ['Figma', 'Photoshop', 'Illustrator', 'After Effects', 'Blender', 'Sketch'],
  },
  {
    id: 'gamer',
    name: 'Gamer Pack',
    icon: Gamepad2,
    description: 'Essential gaming software and tools',
    apps: ['Steam', 'Discord', 'OBS Studio', 'MSI Afterburner', 'Razer Synapse', 'Epic Games'],
  },
];

export default function PacksSection() {
  return (
    <section id="packs" className="py-20 md:py-32 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Curated Software Packs</h2>
          <p className="section-subtitle">Pre-configured bundles for different professional needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {packs.map((pack) => {
            const Icon = pack.icon;
            return (
              <div key={pack.id} className="card flex flex-col">
                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mb-4">
                  <Icon size={32} className="text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{pack.name}</h3>
                <p className="text-slate-600 mb-6 text-sm">{pack.description}</p>
                
                <div className="mb-8 flex-1">
                  <div className="grid grid-cols-2 gap-3">
                    {pack.apps.map((app) => (
                      <div key={app} className="bg-slate-100 rounded-lg px-3 py-2 text-sm font-medium text-slate-700">
                        {app}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="btn btn-primary w-full justify-center">
                  <Download size={20} />
                  Install Pack
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
