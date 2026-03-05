import { Tabs } from 'expo-router';
import { colors } from '../../src/lib/theme';

export default function ResidentLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Главная', tabBarLabel: 'Главная', tabBarIcon: () => null }} />
      <Tabs.Screen name="request" options={{ title: 'Заявка', tabBarLabel: 'Заявка', tabBarIcon: () => null }} />
      <Tabs.Screen name="history" options={{ title: 'Мои заявки', tabBarLabel: 'История', tabBarIcon: () => null }} />
      <Tabs.Screen name="schedule" options={{ title: 'Расписание', tabBarLabel: 'Расписание', tabBarIcon: () => null }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль', tabBarLabel: 'Профиль', tabBarIcon: () => null }} />
    </Tabs>
  );
}
