import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors, statusColors, statusLabels } from '../../src/lib/theme';

interface Request {
  id: string;
  status: string;
  address: string;
  estimatedQty: number;
  notes: string | null;
  createdAt: string;
  material: { nameRu: string };
}

export default function HistoryScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: Request[] }>('/requests?limit=50', token!);
      setRequests(res.data || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Request }) => {
    const sc = statusColors[item.status] || { bg: '#EEE', text: '#666' };
    return (
      <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, marginHorizontal: 16, borderWidth: 1, borderColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }}>{item.material?.nameRu}</Text>
          <View style={{ backgroundColor: sc.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: sc.text }}>{statusLabels[item.status]}</Text>
          </View>
        </View>
        <Text style={{ color: colors.gray, fontSize: 13, marginTop: 6 }}>{item.address}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ color: colors.gray, fontSize: 12 }}>{item.estimatedQty} кг</Text>
          <Text style={{ color: colors.gray, fontSize: 12 }}>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</Text>
        </View>
        {item.notes && <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>{item.notes}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.gray }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={{ paddingVertical: 16 }}
      style={{ backgroundColor: colors.background }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      ListEmptyComponent={
        <View style={{ padding: 40, alignItems: 'center' }}>
          <Text style={{ color: colors.gray, fontSize: 16 }}>Нет заявок</Text>
        </View>
      }
    />
  );
}
