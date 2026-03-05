import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/lib/auth';
import { api } from '../../src/lib/api';
import { colors } from '../../src/lib/theme';

interface Request {
  id: string;
  address: string;
  estimatedQty: number;
  material: { nameRu: string };
  resident: { name: string };
}

interface Material {
  id: string;
  nameRu: string;
}

export default function CollectScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string>('');
  const [materialId, setMaterialId] = useState<string>('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<{ data: Request[] }>('/requests?status=ASSIGNED&limit=50', token!),
      api.get<{ data: Material[] }>('/materials'),
    ]).then(([rRes, mRes]) => {
      setRequests(rRes.data || []);
      setMaterials(mRes.data || []);
    }).catch(() => {});
  }, [token]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Нужно разрешение на использование камеры');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedRequest || !materialId || !weight) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }
    setLoading(true);
    try {
      if (photo) {
        await api.uploadPhoto('/collections', photo, {
          requestId: selectedRequest,
          materialId,
          actualWeightKg: weight,
          notes: notes || '',
        }, token!);
      } else {
        await api.post('/collections', {
          requestId: selectedRequest,
          materialId,
          actualWeightKg: parseFloat(weight),
          notes: notes || undefined,
        }, token!);
      }
      setSuccess(true);
    } catch (err) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось сохранить');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Сбор записан!</Text>
        <Text style={{ fontSize: 14, color: colors.gray, textAlign: 'center', marginTop: 8 }}>
          Заявка отмечена как завершённая. Баллы начислены жителю.
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSuccess(false);
            setSelectedRequest('');
            setMaterialId('');
            setWeight('');
            setNotes('');
            setPhoto(null);
          }}
          style={{ marginTop: 24, backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ color: colors.white, fontWeight: '600' }}>Записать ещё</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentReq = requests.find((r) => r.id === selectedRequest);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16 }}>
        {/* Select request */}
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>Выберите заявку</Text>
        {requests.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {requests.map((r) => (
              <TouchableOpacity
                key={r.id}
                onPress={() => {
                  setSelectedRequest(r.id);
                  const mat = materials.find((m) => m.nameRu === r.material?.nameRu);
                  if (mat) setMaterialId(mat.id);
                }}
                style={{
                  backgroundColor: selectedRequest === r.id ? colors.primary : colors.white,
                  borderRadius: 12, padding: 14, marginRight: 8, minWidth: 160,
                  borderWidth: 1, borderColor: selectedRequest === r.id ? colors.primary : colors.border,
                }}
              >
                <Text style={{ fontWeight: '600', color: selectedRequest === r.id ? colors.white : colors.text, fontSize: 14 }}>
                  {r.resident?.name}
                </Text>
                <Text style={{ fontSize: 12, color: selectedRequest === r.id ? 'rgba(255,255,255,0.8)' : colors.gray, marginTop: 2 }}>
                  {r.material?.nameRu} · ~{r.estimatedQty} кг
                </Text>
                <Text style={{ fontSize: 11, color: selectedRequest === r.id ? 'rgba(255,255,255,0.7)' : colors.gray, marginTop: 2 }}>
                  {r.address}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={{ backgroundColor: colors.white, borderRadius: 12, padding: 24, marginBottom: 16, alignItems: 'center' }}>
            <Text style={{ color: colors.gray }}>Нет назначенных заявок</Text>
          </View>
        )}

        {/* Material select */}
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>Материал</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {materials.map((m) => (
            <TouchableOpacity
              key={m.id}
              onPress={() => setMaterialId(m.id)}
              style={{
                backgroundColor: materialId === m.id ? colors.accent : colors.white,
                borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8,
                borderWidth: 1, borderColor: materialId === m.id ? colors.accent : colors.border,
              }}
            >
              <Text style={{ fontSize: 13, color: materialId === m.id ? colors.white : colors.text }}>{m.nameRu}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Weight */}
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Фактический вес (кг)</Text>
        <TextInput
          value={weight}
          onChangeText={setWeight}
          placeholder={currentReq ? `Оценка: ~${currentReq.estimatedQty} кг` : '0.0'}
          keyboardType="numeric"
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 }}
        />

        {/* Photo */}
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 8 }}>Фото (необязательно)</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={takePhoto}
            style={{ flex: 1, backgroundColor: colors.white, borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.primary, fontWeight: '500' }}>📷 Камера</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickPhoto}
            style={{ flex: 1, backgroundColor: colors.white, borderRadius: 8, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.border }}
          >
            <Text style={{ color: colors.primary, fontWeight: '500' }}>🖼 Галерея</Text>
          </TouchableOpacity>
        </View>
        {photo && (
          <Image source={{ uri: photo }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }} resizeMode="cover" />
        )}

        {/* Notes */}
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text, marginBottom: 6 }}>Заметки</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Качество, заметки..."
          multiline
          numberOfLines={3}
          style={{ backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 24, textAlignVertical: 'top' }}
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: colors.primary, borderRadius: 8, padding: 16, alignItems: 'center', opacity: loading ? 0.6 : 1, marginBottom: 32 }}
        >
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: '600' }}>
            {loading ? 'Сохранение...' : 'Записать сбор'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
