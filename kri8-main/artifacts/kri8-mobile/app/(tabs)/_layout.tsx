import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/navigation/TabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ideas/index" />
      <Tabs.Screen name="capture" />
      <Tabs.Screen name="community/index" />
      <Tabs.Screen name="ai" />
      <Tabs.Screen name="profile/index" />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="ideas/[id]" options={{ href: null }} />
      <Tabs.Screen name="community/messages/[userId]" options={{ href: null }} />
      <Tabs.Screen name="profile/[username]" options={{ href: null }} />
    </Tabs>
  );
}
