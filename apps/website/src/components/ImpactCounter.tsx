'use client';

import { useEffect, useState, useRef } from 'react';
import { Recycle, TreePine, Droplets } from 'lucide-react';
import { useT } from '@/lib/i18n';

function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

export default function ImpactCounter() {
  const t = useT();
  const stats = [
    { icon: Recycle, target: 5000, label: t('impact.materials') },
    { icon: TreePine, target: 85, label: t('impact.trees') },
    { icon: Droplets, target: 12000, label: t('impact.water') },
  ];
  const counters = stats.map((s) => useCountUp(s.target));

  return (
    <section className="relative bg-brand-900 py-20 overflow-hidden">
      {/* Subtle diagonal pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            white 10px,
            white 11px
          )`,
        }}
      />

      <div className="relative max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const counter = counters[i];
            return (
              <div key={i} ref={counter.ref} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-5 backdrop-blur-sm">
                  <Icon className="h-7 w-7 text-brand-300" />
                </div>
                <p className="text-5xl font-bold text-white tracking-tight">
                  {counter.count.toLocaleString()}
                </p>
                <p className="text-brand-300 text-sm font-medium uppercase tracking-wider mt-2">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
