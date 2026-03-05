import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors, statusColors, statusLabels } from '../../src/lib/theme';

interface Schedule {
  id: string;
  area: string;
  dayOfWeek: number;
  time: string;
}

interface Request {
  id: string;
  status: string;
  estimatedQty: number;
  createdAt: string;
  material: { nameRu: string };
}

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function HomeScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const [sRes, rRes] = await Promise.all([
        api.get<{ data: Schedule[] }>('/schedule'),
        api.get<{ data: Request[] }>('/requests?limit=5', token!),
      ]);
      setSchedules(sRes.data || []);
      setRequests(rRes.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Welcome */}
      <View style={{ backgroundColor: colors.primary, padding: 24, paddingBottom: 32, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Добро пожаловать,</Text>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.white, marginTop: 4 }}>{user?.name}</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, flex: 1 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Мои баллы</Text>
            <Text style={{ color: colors.white, fontSize: 20, fontWeight: 'bold' }}>{user?.points || 0}</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(resident)/request')}
            style={{ backgroundColor: colors.accent, borderRadius: 12, padding: 12, flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <Text style={{ color: colors.white, fontSize: 14, fontWeight: '600' }}>+ Новая заявка</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        {/* Upcoming schedule */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Ближайший сбор</Text>
        {schedules.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {schedules.slice(0, 5).map((s) => (
              <View key={s.id} style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, marginRight: 12, minWidth: 140, borderWidth: 1, borderColor: colors.border }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.primary }}>{DAYS[s.dayOfWeek]}</Text>
                <Text style={{ fontSize: 14, color: colors.gray, marginTop: 4 }}>{s.time}</Text>
                <Text style={{ fontSize: 13, color: colors.text, marginTop: 8 }}>{s.area}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 24 }}>
            <Text style={{ color: colors.gray, textAlign: 'center' }}>Загрузка расписания...</Text>
          </View>
        )}

        {/* Recent requests */}
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Мои заявки</Text>
        {requests.length > 0 ? (
          requests.map((r) => {
            const sc = statusColors[r.status] || { bg: '#EEE', text: '#666' };
            return (
              <View key={r.id} style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '600', color: colors.text }}>{r.material?.nameRu}</Text>
                  <View style={{ backgroundColor: sc.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: sc.text }}>{statusLabels[r.status]}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4 }}>
                  {r.estimatedQty} кг · {new Date(r.createdAt).toLocaleDateString('ru-RU')}
                </Text>
              </View>
            );
          })
        ) : (
          <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: colors.gray }}>У вас пока нет заявок</Text>
            <TouchableOpacity
              onPress={() => router.push('/(resident)/request')}
              style={{ marginTop: 12, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: colors.white, fontWeight: '600' }}>Создать заявку</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
