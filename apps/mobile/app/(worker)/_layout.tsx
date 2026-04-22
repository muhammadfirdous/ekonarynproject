import { Tabs } from 'expo-router';
import { colors } from '../../src/lib/theme';

export default function WorkerLayout() {
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
      <Tabs.Screen name="today" options={{ title: 'Маршрут', tabBarLabel: 'Сегодня', tabBarIcon: () => null }} />
      <Tabs.Screen name="collect" options={{ title: 'Новый сбор', tabBarLabel: 'Сбор', tabBarIcon: () => null }} />
      <Tabs.Screen name="mycollections" options={{ title: 'Мои сборы', tabBarLabel: 'История', tabBarIcon: () => null }} />
      <Tabs.Screen name="workerprofile" options={{ title: 'Профиль', tabBarLabel: 'Профиль', tabBarIcon: () => null }} />
    </Tabs>
  );
}
