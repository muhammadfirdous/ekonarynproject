import { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

interface Stop {
  address: string;
  order: number;
  notes?: string;
  requestId?: string;
}

interface Route {
  id: string;
  date: string;
  status: string;
  stops: Stop[];
}

interface Request {
  id: string;
  address: string;
  estimatedQty: number;
  status: string;
  material: { nameRu: string };
  resident: { name: string; phone: string };
}

export default function TodayScreen() {
  const { user, token } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [rRes, reqRes] = await Promise.all([
        api.get<{ data: Route[] }>(`/routes?date=${today}`, token!),
        api.get<{ data: Request[] }>('/requests?status=ASSIGNED&limit=20', token!),
      ]);
      setRoutes(rRes.data || []);
      setRequests(reqRes.data || []);
    } catch {}
  };

  useEffect(() => { load(); }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const todayRoute = routes[0];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Добро пожаловать,</Text>
        <Text style={{ color: colors.white, fontSize: 20, fontWeight: 'bold' }}>{user?.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 }}>
          {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      {/* Today's route */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Маршрут на сегодня</Text>
      {todayRoute ? (
        <View style={{ backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}>
          {todayRoute.stops.map((stop, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                const encoded = encodeURIComponent(stop.address + ', Нарын, Кыргызстан');
                Linking.openURL(`https://maps.google.com/?q=${encoded}`);
              }}
              style={{
                flexDirection: 'row', padding: 16, alignItems: 'flex-start',
                borderBottomWidth: i < todayRoute.stops.length - 1 ? 1 : 0,
                borderBottomColor: '#F0F0F0',
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light, justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 2 }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: colors.primary }}>{stop.order}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text }}>{stop.address}</Text>
                {stop.notes && <Text style={{ fontSize: 13, color: colors.gray, marginTop: 2 }}>{stop.notes}</Text>}
              </View>
              <Text style={{ color: colors.accent, fontSize: 12 }}>Карта →</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.gray }}>Маршрут на сегодня не назначен</Text>
        </View>
      )}

      {/* Assigned requests */}
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 12 }}>Назначенные заявки</Text>
      {requests.length > 0 ? (
        requests.map((req) => (
          <View key={req.id} style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '600', color: colors.text }}>{req.resident?.name}</Text>
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${req.resident?.phone}`)}>
                <Text style={{ color: colors.primary, fontWeight: '500' }}>{req.resident?.phone}</Text>
              </TouchableOpacity>
            </View>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4 }}>{req.material?.nameRu} · ~{req.estimatedQty} кг</Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 2 }}>{req.address}</Text>
          </View>
        ))
      ) : (
        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}>
          <Text style={{ color: colors.gray }}>Нет назначенных заявок</Text>
        </View>
      )}
    </ScrollView>
  );
}
