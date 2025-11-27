'use client';

import { Zap, RefreshCw, Trash2, Wrench, Sparkles, Globe } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'One-Click Multi-App Install',
    description: 'Install multiple applications simultaneously with a single click. No more waiting for one installer to finish before starting the next.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-Update All Apps',
    description: 'Keep all your software up-to-date automatically. Never worry about outdated applications or security vulnerabilities.',
  },
  {
    icon: Trash2,
    title: 'One-Click Uninstall & Cleanup',
    description: 'Remove applications completely with all their associated files, registry entries, and leftover data.',
  },
  {
    icon: Wrench,
    title: 'Repair Broken Installs',
    description: 'Fix corrupted installations, missing dependencies, and broken shortcuts automatically.',
  },
  {
    icon: Sparkles,
    title: 'AI-Driven Recommendations',
    description: 'Get intelligent suggestions for software based on your usage patterns and professional needs.',
  },
  {
    icon: Globe,
    title: 'Offline-First Installer Packs',
    description: 'Download complete installer packs for offline installation. Perfect for emerging markets and remote locations.',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="section-title mb-4">Why Kliiq?</h2>
          <p className="section-subtitle">Powerful features designed for modern PC management</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="card group hover:border-primary">
                <div className="w-14 h-14 bg-gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                  <Icon size={28} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
