import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

interface Material {
  id: string;
  nameRu: string;
  buyingPrice: number;
  unit: string;
}

export default function RequestScreen() {
  const { user, token } = useAuth();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [address, setAddress] = useState(user?.address || '');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get<{ data: Material[] }>('/materials')
      .then((r) => setMaterials(r.data || []))
      .catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!selectedMaterial || !address || !qty) {
      Alert.alert('Ошибка', 'Заполните все обязательные поля');
      return;
    }
    setLoading(true);
    try {
      await api.post('/requests', {
        materialId: selectedMaterial,
        address,
        estimatedQty: parseFloat(qty),
        notes: notes || undefined,
      }, token!);
      setSuccess(true);
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось создать заявку');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Заявка принята!</Text>
        <Text style={{ fontSize: 14, color: colors.gray, textAlign: 'center', marginTop: 8 }}>
          Наш работник свяжется с вами и приедет для сбора материалов.
        </Text>
        <TouchableOpacity
          onPress={() => { setSuccess(false); setSelectedMaterial(''); setQty(''); setNotes(''); }}
          style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>Создать ещё</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>Материал</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {materials.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setSelectedMaterial(m.id)}
              style={{
                backgroundColor: selectedMaterial === m.id ? colors.primary : colors.white,
                borderRadius: 12, padding: 14, borderWidth: 1,
                borderColor: selectedMaterial === m.id ? colors.primary : colors.border,
                minWidth: '47%',
              }}
            >
              <Text style={{ fontWeight: '600', color: selectedMaterial === m.id ? colors.white : colors.text }}>{m.nameRu}</Text>
              <Text style={{ fontSize: 12, color: selectedMaterial === m.id ? 'rgba(255,255,255,0.8)' : colors.gray, marginTop: 2 }}>
                {m.buyingPrice} сом/{m.unit}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Адрес</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="ул. Ленина 12, кв 5"
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
        />

        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Примерный вес (кг)</Text>
        <TextInput
          value={qty}
          onChangeText={setQty}
          placeholder="5"
          keyboardType="numeric"
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
        />

        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Заметки</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Позвоните перед приходом..."
          multiline
          numberOfLines={3}
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24, textAlignVertical: 'top' }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Отправка...' : 'Отправить заявку'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
