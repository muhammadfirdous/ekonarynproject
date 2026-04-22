import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

interface CollectionStats {
  totalCollections: number;
  totalWeight: number;
}

export default function WorkerProfileScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<CollectionStats>({ totalCollections: 0, totalWeight: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: any[] }>('/collections?limit=200', token!);
      const collections = res.data || [];
      setStats({
        totalCollections: collections.length,
        totalWeight: collections.reduce((sum: number, c: any) => sum + (c.actualWeightKg || 0), 0),
      });
    } catch {}
  }, [token]);

  useEffect(() => { loadStats(); }, [loadStats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Вы уверены, что хотите выйти?');
      if (confirmed) {
        logout().finally(() => router.replace('/' as any));
      }
    } else {
      Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Выйти',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } finally {
              router.replace('/' as any);
            }
          },
        },
      ]);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Profile card */}
      <View style={{
        backgroundColor: colors.primary, borderRadius: 20, padding: 24, alignItems: 'center',
        marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 12, elevation: 4,
      }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)',
          justifyContent: 'center', alignItems: 'center', marginBottom: 14,
          borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)',
        }}>
          <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.white }}>{user?.name?.[0]}</Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: colors.white }}>{user?.name}</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{user?.phone}</Text>
        <View style={{
          backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 5,
          borderRadius: 20, marginTop: 10,
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.white }}>👷 Работник</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        <View style={{
          flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16,
          alignItems: 'center', borderWidth: 1, borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary }}>{stats.totalCollections}</Text>
          <Text style={{ fontSize: 12, color: colors.gray, marginTop: 4 }}>Всего сборов</Text>
        </View>
        <View style={{
          flex: 1, backgroundColor: colors.white, borderRadius: 16, padding: 16,
          alignItems: 'center', borderWidth: 1, borderColor: colors.border,
        }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.accent }}>{stats.totalWeight.toFixed(1)}</Text>
          <Text style={{ fontSize: 12, color: colors.gray, marginTop: 4 }}>Общий вес (кг)</Text>
        </View>
      </View>

      {/* User Info */}
      <View style={{
        backgroundColor: colors.white, borderRadius: 16, borderWidth: 1,
        borderColor: colors.border, marginBottom: 16, overflow: 'hidden',
      }}>
        <View style={{ backgroundColor: colors.light, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ fontWeight: '600', color: colors.primary, fontSize: 14 }}>Личные данные</Text>
        </View>
        {[
          { icon: '👤', label: 'Имя', value: user?.name },
          { icon: '📱', label: 'Телефон', value: user?.phone },
          { icon: '📍', label: 'Адрес', value: user?.address || 'Не указан' },
          { icon: '🏷', label: 'Роль', value: 'Работник (Сборщик)' },
        ].map((item, i) => (
          <View key={i} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 14,
            borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: '#F5F5F5',
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ fontSize: 16, marginRight: 10 }}>{item.icon}</Text>
              <Text style={{ color: colors.gray, fontSize: 14 }}>{item.label}</Text>
            </View>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500', maxWidth: '55%', textAlign: 'right' }}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Contact dispatcher */}
      <View style={{ backgroundColor: colors.light, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', color: colors.primary, marginBottom: 6 }}>📞 Контакт диспетчера</Text>
        <Text style={{ fontSize: 13, color: colors.gray, lineHeight: 20 }}>
          По вопросам маршрутов и заявок звоните: +996 700 000 001 (Айбек)
        </Text>
      </View>

      {/* Logout button */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{
          backgroundColor: '#FFF5F5', borderRadius: 16, padding: 16, alignItems: 'center',
          borderWidth: 1, borderColor: '#FFCDD2', marginBottom: 32,
          flexDirection: 'row', justifyContent: 'center', gap: 8,
        }}
      >
        <Text style={{ fontSize: 18 }}>🚪</Text>
        <Text style={{ color: colors.error, fontWeight: '600', fontSize: 15 }}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
