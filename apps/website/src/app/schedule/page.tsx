'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/utils';
import { Clock, MapPin } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
  active: boolean;
}

export default function SchedulePage() {
  const t = useT();
  const [schedule, setSchedule] = useState<Schedule[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/schedule`)
      .then((r) => r.json())
      .then((d) => setSchedule(d.data || []))
      .catch(() => {});
  }, []);

  const dayNames = [
    t('schedule.monday'),
    t('schedule.tuesday'),
    t('schedule.wednesday'),
    t('schedule.thursday'),
    t('schedule.friday'),
    t('schedule.saturday'),
    t('schedule.sunday'),
  ];

  // Group by day
  const byDay: Record<number, Schedule[]> = {};
  schedule.forEach((s) => {
    if (!byDay[s.dayOfWeek]) byDay[s.dayOfWeek] = [];
    byDay[s.dayOfWeek].push(s);
  });

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-300/15 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-700 text-sm font-medium px-3 py-1 rounded-full border border-brand-200 mb-5">
            {t('schedule.badge')}
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-neutral-900 tracking-tight">
            {t('schedule.title')}
          </h1>
          <p className="mt-4 text-lg text-neutral-500">{t('schedule.sub')}</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          {schedule.length > 0 ? (
            <div className="space-y-4">
              {dayNames.map((dayName, dayIndex) => {
                const daySchedule = byDay[dayIndex];
                if (!daySchedule) return null;
                return (
                  <div key={dayIndex} className="bg-white rounded-2xl border border-neutral-100 shadow-card overflow-hidden">
                    <div className="bg-brand-50 px-6 py-3 border-b border-brand-100">
                      <h3 className="font-semibold text-brand-700 text-sm uppercase tracking-wide">{dayName}</h3>
                    </div>
                    <div className="divide-y divide-neutral-50">
                      {daySchedule.sort((a, b) => a.time.localeCompare(b.time)).map((s) => (
                        <div key={s.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                              <MapPin className="h-4 w-4 text-brand-700" />
                            </div>
                            <span className="font-medium text-neutral-900">{s.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-neutral-500">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">{s.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-neutral-50 rounded-2xl p-8 text-center text-neutral-500 border border-neutral-100">
              <p>{t('schedule.empty')}</p>
              <p className="mt-2">
                {t('schedule.callUs')} <strong>+996 700 000 001</strong>
              </p>
            </div>
          )}

          <div className="mt-8 bg-brand-50 rounded-2xl border border-brand-100 p-6">
            <h3 className="font-semibold text-neutral-900 mb-2">{t('schedule.notFoundTitle')}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">{t('schedule.notFoundDesc')}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
