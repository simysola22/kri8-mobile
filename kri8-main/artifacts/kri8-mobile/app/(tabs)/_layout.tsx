import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ideas" />
      <Tabs.Screen name="capture" />
      <Tabs.Screen name="community" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
