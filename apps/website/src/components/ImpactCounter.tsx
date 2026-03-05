'use client';

import { useEffect, useState, useRef } from 'react';
import { Recycle, TreePine, Droplets } from 'lucide-react';

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
  const kg = useCountUp(5000);
  const trees = useCountUp(85);
  const water = useCountUp(12000);

  return (
    <section className="bg-primary py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white text-center mb-10">Наш вклад</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div ref={kg.ref} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <Recycle className="h-8 w-8 text-accent" />
            </div>
            <p className="text-4xl font-bold text-white">{kg.count.toLocaleString()}</p>
            <p className="text-white/70 mt-1">кг материалов собрано</p>
          </div>
          <div ref={trees.ref} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <TreePine className="h-8 w-8 text-accent" />
            </div>
            <p className="text-4xl font-bold text-white">{trees.count}</p>
            <p className="text-white/70 mt-1">деревьев сохранено</p>
          </div>
          <div ref={water.ref} className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <Droplets className="h-8 w-8 text-accent" />
            </div>
            <p className="text-4xl font-bold text-white">{water.count.toLocaleString()}</p>
            <p className="text-white/70 mt-1">литров воды сэкономлено</p>
          </div>
        </div>
      </div>
    </section>
  );
}
