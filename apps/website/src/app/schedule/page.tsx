import { API_URL } from '@/lib/utils';
import { Clock, MapPin } from 'lucide-react';

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
  active: boolean;
}

async function getSchedule(): Promise<Schedule[]> {
  try {
    const res = await fetch(`${API_URL}/schedule`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

export default async function SchedulePage() {
  const schedule = await getSchedule();

  // Group by day
  const byDay: Record<number, Schedule[]> = {};
  schedule.forEach((s) => {
    if (!byDay[s.dayOfWeek]) byDay[s.dayOfWeek] = [];
    byDay[s.dayOfWeek].push(s);
  });

  return (
    <main>
      <section className="bg-gradient-to-br from-primary to-primary-light py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white">Расписание сбора</h1>
          <p className="mt-4 text-lg text-white/80">Когда мы приезжаем в ваш район</p>
        </div>
      </section>

      <section className="py-16 bg-eco-bg">
        <div className="max-w-4xl mx-auto px-4">
          {schedule.length > 0 ? (
            <div className="space-y-4">
              {DAY_NAMES.map((dayName, dayIndex) => {
                const daySchedule = byDay[dayIndex];
                if (!daySchedule) return null;
                return (
                  <div key={dayIndex} className="bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-eco-light px-6 py-3">
                      <h3 className="font-semibold text-primary">{dayName}</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {daySchedule.sort((a, b) => a.time.localeCompare(b.time)).map((s) => (
                        <div key={s.id} className="px-6 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-accent" />
                            <span className="font-medium text-eco-text">{s.area}</span>
                          </div>
                          <div className="flex items-center gap-2 text-eco-gray">
                            <Clock className="h-4 w-4" />
                            <span>{s.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-card p-8 text-center text-eco-gray">
              <p>Расписание загружается с сервера.</p>
              <p className="mt-2">Позвоните нам: <strong>+996 700 000 001</strong></p>
            </div>
          )}

          <div className="mt-8 bg-eco-light rounded-card p-6">
            <h3 className="font-semibold text-eco-text mb-2">Не нашли свой район?</h3>
            <p className="text-sm text-eco-gray">
              Мы расширяем зону покрытия! Оставьте заявку, и мы постараемся приехать к вам.
              Для больших объемов (от 20 кг) мы приедем в любой район Нарына.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
