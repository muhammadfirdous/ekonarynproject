import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors, statusColors } from '../../src/lib/theme';

interface Stats {
  total: number;
  pending: number;
  assigned: number;
  completed: number;
}

export default function ProfileScreen() {
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, assigned: 0, completed: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<{ data: any[]; total: number }>('/requests?limit=200', token!);
      const requests = res.data || [];
      setStats({
        total: requests.length,
        pending: requests.filter((r: any) => r.status === 'PENDING').length,
        assigned: requests.filter((r: any) => r.status === 'ASSIGNED').length,
        completed: requests.filter((r: any) => r.status === 'COMPLETED').length,
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
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.white }}>
            {user?.role === 'RESIDENT' ? '🏠 Житель' : user?.role === 'WORKER' ? '👷 Работник' : '👑 Админ'}
          </Text>
        </View>
      </View>

      {/* Points card */}
      <View style={{
        backgroundColor: colors.white, borderRadius: 16, padding: 20, marginBottom: 16,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderWidth: 1, borderColor: colors.border,
      }}>
        <View>
          <Text style={{ color: colors.gray, fontSize: 13 }}>Мои баллы</Text>
          <Text style={{ color: colors.primary, fontSize: 32, fontWeight: 'bold' }}>{user?.points || 0}</Text>
        </View>
        <View style={{ backgroundColor: colors.light, borderRadius: 12, padding: 14 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '500' }}>1 кг = 1 балл</Text>
          <Text style={{ color: colors.gray, fontSize: 11, marginTop: 2 }}>За каждый сданный кг</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Всего', value: stats.total, bg: '#F5F5F5', color: colors.text },
          { label: 'Ожидают', value: stats.pending, bg: statusColors.PENDING.bg, color: statusColors.PENDING.text },
          { label: 'В работе', value: stats.assigned, bg: statusColors.ASSIGNED.bg, color: statusColors.ASSIGNED.text },
          { label: 'Готово', value: stats.completed, bg: statusColors.COMPLETED.bg, color: statusColors.COMPLETED.text },
        ].map((s, i) => (
          <View key={i} style={{
            flex: 1, backgroundColor: s.bg, borderRadius: 12, padding: 12, alignItems: 'center',
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: s.color }}>{s.value}</Text>
            <Text style={{ fontSize: 10, color: s.color, marginTop: 2 }}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* User Info */}
      <View style={{ backgroundColor: colors.white, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 16, overflow: 'hidden' }}>
        <View style={{ backgroundColor: colors.light, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Text style={{ fontWeight: '600', color: colors.primary, fontSize: 14 }}>Личные данные</Text>
        </View>
        {[
          { icon: '👤', label: 'Имя', value: user?.name },
          { icon: '📱', label: 'Телефон', value: user?.phone },
          { icon: '📍', label: 'Адрес', value: user?.address || 'Не указан' },
          { icon: '🏷', label: 'Роль', value: user?.role === 'RESIDENT' ? 'Житель' : user?.role === 'WORKER' ? 'Работник' : 'Администратор' },
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

      {/* Education link */}
      <View style={{ backgroundColor: colors.light, borderRadius: 16, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', color: colors.primary, marginBottom: 6 }}>💡 Экообразование</Text>
        <Text style={{ fontSize: 13, color: colors.gray, lineHeight: 20 }}>
          Знаете ли вы, что ПЭТ бутылка разлагается 400-450 лет? Не сжигайте — сдавайте нам! При сжигании пластика выделяются опасные диоксины.
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
