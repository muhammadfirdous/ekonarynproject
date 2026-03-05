import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

interface Collection {
  id: string;
  actualWeightKg: number;
  collectedAt: string;
  notes: string | null;
  material: { nameRu: string };
  request: { resident: { name: string } };
}

export default function MyCollectionsScreen() {
  const { token } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api.get<{ data: Collection[] }>('/collections?limit=50', token!);
      setCollections(res.data || []);
    } catch {}
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  // Summary
  const totalWeight = collections.reduce((sum, c) => sum + c.actualWeightKg, 0);

  const renderItem = ({ item }: { item: Collection }) => (
    <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, marginBottom: 8, marginHorizontal: 16, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontWeight: '600', color: colors.text }}>{item.material?.nameRu}</Text>
        <Text style={{ fontWeight: 'bold', color: colors.primary, fontSize: 16 }}>{item.actualWeightKg.toFixed(1)} кг</Text>
      </View>
      <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4 }}>
        Житель: {item.request?.resident?.name}
      </Text>
      <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>
        {new Date(item.collectedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
      </Text>
      {item.notes && <Text style={{ color: colors.gray, fontSize: 12, marginTop: 4, fontStyle: 'italic' }}>{item.notes}</Text>}
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.gray }}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Summary header */}
      <View style={{ backgroundColor: colors.primary, padding: 20, flexDirection: 'row', gap: 16 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Всего сборов</Text>
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: 'bold' }}>{collections.length}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Общий вес</Text>
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: 'bold' }}>{totalWeight.toFixed(1)} кг</Text>
        </View>
      </View>

      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: colors.gray, fontSize: 16 }}>Нет записей о сборах</Text>
          </View>
        }
      />
    </View>
  );
}
