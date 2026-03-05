import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
}

export default function ScheduleScreen() {
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const res = await api.get<{ data: Schedule[] }>('/schedule');
      setSchedule(res.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const byDay: Record<number, Schedule[]> = {};
  schedule.forEach((s) => {
    if (!byDay[s.dayOfWeek]) byDay[s.dayOfWeek] = [];
    byDay[s.dayOfWeek].push(s);
  });

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {DAY_NAMES.map((dayName, dayIndex) => {
        const daySchedule = byDay[dayIndex];
        if (!daySchedule) return null;
        return (
          <View key={dayIndex} style={{ backgroundColor: colors.white, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }}>
            <View style={{ backgroundColor: colors.light, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ fontWeight: '600', color: colors.primary }}>{dayName}</Text>
            </View>
            {daySchedule.sort((a, b) => a.time.localeCompare(b.time)).map((s) => (
              <View key={s.id} style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F0F0F0' }}>
                <Text style={{ color: colors.text, fontSize: 15 }}>{s.area}</Text>
                <Text style={{ color: colors.gray, fontSize: 14 }}>{s.time}</Text>
              </View>
            ))}
          </View>
        );
      })}

      {schedule.length === 0 && (
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.gray }}>Расписание загружается...</Text>
        </View>
      )}

      <View style={{ backgroundColor: colors.light, borderRadius: 12, padding: 16, marginTop: 8 }}>
        <Text style={{ fontWeight: '600', color: colors.primary, marginBottom: 4 }}>Не нашли свой район?</Text>
        <Text style={{ fontSize: 13, color: colors.gray }}>
          Позвоните нам: +996 700 000 001. Для объемов от 20 кг мы приедем в любой район!
        </Text>
      </View>
    </ScrollView>
  );
}
