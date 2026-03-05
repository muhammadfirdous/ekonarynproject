import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useAuth } from '../../src/lib/auth';
import { colors } from '../../src/lib/theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+996');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !phone || !password) return;
    setLoading(true);
    try {
      await register(name, phone, password, address || undefined);
      router.replace('/(resident)/home');
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось зарегистрироваться');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        style={{ backgroundColor: colors.background }}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text }}>Регистрация</Text>
          <Text style={{ fontSize: 14, color: colors.gray, marginTop: 4 }}>Создайте аккаунт в Эко Нарын</Text>
        </View>

        <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Имя</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ваше имя"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Телефон</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+996700123456"
            keyboardType="phone-pad"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Пароль</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Минимум 6 символов"
            secureTextEntry
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
          />

          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Адрес (необязательно)</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            placeholder="ул. Ленина 12, кв 5"
            style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24 }}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 14, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
          >
            <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </Text>
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={{ marginTop: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.gray }}>
              Уже есть аккаунт? <Text style={{ color: colors.primary, fontWeight: '600' }}>Войти</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
