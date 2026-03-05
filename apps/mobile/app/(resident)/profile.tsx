import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { colors } from '../../src/lib/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Выйти',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
      {/* Profile card */}
      <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.light, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: colors.primary }}>{user?.name?.[0]}</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>{user?.name}</Text>
        <Text style={{ fontSize: 14, color: colors.gray, marginTop: 4 }}>{user?.phone}</Text>
        {user?.address && <Text style={{ fontSize: 13, color: colors.gray, marginTop: 4 }}>{user.address}</Text>}
      </View>

      {/* Points */}
      <View style={{ backgroundColor: colors.primary, borderRadius: 12, padding: 20, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Мои баллы</Text>
          <Text style={{ color: colors.white, fontSize: 28, fontWeight: 'bold' }}>{user?.points || 0}</Text>
        </View>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 }}>
          <Text style={{ color: colors.white, fontSize: 12 }}>1 кг = 1 балл</Text>
        </View>
      </View>

      {/* Info */}
      <View style={{ backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 }}>
        {[
          { label: 'Роль', value: user?.role === 'RESIDENT' ? 'Житель' : user?.role === 'WORKER' ? 'Работник' : 'Админ' },
          { label: 'Телефон', value: user?.phone },
          { label: 'Адрес', value: user?.address || 'Не указан' },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: '#F0F0F0' }}>
            <Text style={{ color: colors.gray, fontSize: 14 }}>{item.label}</Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{item.value}</Text>
          </View>
        ))}
      </View>

      {/* Education link */}
      <View style={{ backgroundColor: colors.light, borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <Text style={{ fontWeight: '600', color: colors.primary, marginBottom: 4 }}>Экообразование</Text>
        <Text style={{ fontSize: 13, color: colors.gray }}>
          Знаете ли вы, что ПЭТ бутылка разлагается 400-450 лет? Не сжигайте — сдавайте нам! При сжигании пластика выделяются опасные диоксины.
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: colors.white, borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#FFCDD2' }}
      >
        <Text style={{ color: colors.error, fontWeight: '600' }}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
