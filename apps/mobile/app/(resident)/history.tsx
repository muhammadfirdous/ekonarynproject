import { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
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
  collection?: {
    actualWeightKg: number;
    collectedAt: string;
  } | null;
}

const STATUS_STEPS = ['PENDING', 'ASSIGNED', 'COMPLETED'];
const STATUS_STEP_LABELS: Record<string, string> = {
  PENDING: 'Заявка создана',
  ASSIGNED: 'Работник назначен',
  COMPLETED: 'Сбор завершён',
  CANCELLED: 'Отменена',
};

function StatusTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFCDD2', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 10, color: '#C62828' }}>✕</Text>
        </View>
        <Text style={{ marginLeft: 8, fontSize: 13, color: '#C62828', fontWeight: '600' }}>Заявка отменена</Text>
      </View>
    );
  }

  const currentIndex = STATUS_STEPS.indexOf(status);

  return (
    <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {STATUS_STEPS.map((step, i) => {
          const isActive = i <= currentIndex;
          const isCurrent = i === currentIndex;
          return (
            <View key={step} style={{ flexDirection: 'row', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 0 }}>
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    width: isCurrent ? 24 : 18,
                    height: isCurrent ? 24 : 18,
                    borderRadius: 12,
                    backgroundColor: isActive ? (isCurrent ? colors.primary : colors.accent) : '#E0E0E0',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: isCurrent ? 3 : 0,
                    borderColor: isCurrent ? colors.light : undefined,
                  }}
                >
                  {isActive && i < currentIndex && (
                    <Text style={{ fontSize: 9, color: colors.white }}>✓</Text>
                  )}
                  {isCurrent && (
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.white }} />
                  )}
                </View>
                <Text style={{
                  fontSize: 10,
                  color: isActive ? colors.text : colors.gray,
                  fontWeight: isCurrent ? '600' : '400',
                  marginTop: 4,
                  textAlign: 'center',
                  width: 70,
                }}>
                  {STATUS_STEP_LABELS[step]}
                </Text>
              </View>
              {i < STATUS_STEPS.length - 1 && (
                <View style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: i < currentIndex ? colors.accent : '#E0E0E0',
                  marginHorizontal: 4,
                  marginBottom: 18,
                }} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try {
      const url = `/requests?limit=50${filter ? `&status=${filter}` : ''}`;
      const res = await api.get<{ data: Request[] }>(url, token!);
      setRequests(res.data || []);
    } catch {}
    setLoading(false);
  }, [token, filter]);

  useEffect(() => { load(); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filters = [
    { key: '', label: 'Все' },
    { key: 'PENDING', label: 'Ожидают' },
    { key: 'ASSIGNED', label: 'Назначены' },
    { key: 'COMPLETED', label: 'Завершены' },
    { key: 'CANCELLED', label: 'Отменены' },
  ];

  const renderItem = ({ item }: { item: Request }) => {
    const sc = statusColors[item.status] || { bg: '#EEE', text: '#666' };
    return (
      <View style={{
        backgroundColor: colors.white, borderRadius: 16, padding: 16, marginBottom: 10,
        marginHorizontal: 16, borderWidth: 1, borderColor: colors.border,
        shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.light, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
              <Text style={{ fontSize: 16 }}>
                {item.material?.nameRu?.includes('ПЭТ') ? '🍶' :
                 item.material?.nameRu?.includes('Картон') ? '📦' :
                 item.material?.nameRu?.includes('HDPE') ? '🧴' :
                 item.material?.nameRu?.includes('Бумага') ? '📄' : '♻️'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '600', color: colors.text, fontSize: 15 }}>{item.material?.nameRu}</Text>
              <Text style={{ color: colors.gray, fontSize: 12, marginTop: 2 }}>{item.address}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: sc.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: sc.text }}>{statusLabels[item.status]}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F5F5F5' }}>
          <Text style={{ color: colors.gray, fontSize: 12 }}>~{item.estimatedQty} кг</Text>
          {item.collection && (
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>
              Собрано: {item.collection.actualWeightKg.toFixed(1)} кг
            </Text>
          )}
          <Text style={{ color: colors.gray, fontSize: 12 }}>
            {new Date(item.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {item.notes && (
          <Text style={{ color: colors.gray, fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>💬 {item.notes}</Text>
        )}

        <StatusTimeline status={item.status} />
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Filter tabs */}
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
        <FlatList
          horizontal
          data={filters}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              onPress={() => { setFilter(f.key); setLoading(true); }}
              style={{
                backgroundColor: filter === f.key ? colors.primary : colors.white,
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginRight: 8,
                borderWidth: 1, borderColor: filter === f.key ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '500',
                color: filter === f.key ? colors.white : colors.gray,
              }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingVertical: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: colors.gray, fontSize: 16 }}>Нет заявок</Text>
            <Text style={{ color: colors.gray, fontSize: 13, marginTop: 4 }}>
              Потяните вниз для обновления
            </Text>
          </View>
        }
      />
    </View>
  );
}
