import { HapticTab } from '@/components/haptic-tab';
import { APP_COLORS } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACTIVE_ICON_SIZE = 20;
const INACTIVE_ICON_SIZE = 24;

function TabIconWithPill({
  focused,
  name,
  size,
  label,
  tintColor,
}: {
  focused: boolean;
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  label: string;
  tintColor?: string;
}) {
  const iconColor = focused ? '#FFFFFF' : (tintColor ?? '#374151');
  const iconSize = focused ? ACTIVE_ICON_SIZE : (size ?? INACTIVE_ICON_SIZE);
  const content = (
    <View style={focused ? styles.pillInner : undefined} pointerEvents="none">
      <Ionicons name={name} size={iconSize} color={iconColor} />
    </View>
  );
  if (focused) {
    return <View style={styles.pill}>{content}</View>;
  }
  return <View style={styles.iconOnly}>{content}</View>;
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: APP_COLORS.primary,
    width: 56,
    height: 40,
    borderRadius: 24,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOnly: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 44,
    minHeight: 44,
  },
});

const TAB_BAR_BASE = {
  backgroundColor: '#F3F4F6',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  paddingTop: 6,
};

export default function TabLayout() {
  const { user, isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const tabBarStyle = {
    ...TAB_BAR_BASE,
    height: 64 + insets.bottom,
    paddingBottom: Math.max(insets.bottom, 6),
  };

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role ?? 'CANDIDATE';
  if (role === 'ADMIN') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: '#fff',
          tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarLabel: ({ focused, children }) => (focused ? children : null),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Admin',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size ?? 24} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  if (role === 'CANDIDATE') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: APP_COLORS.primary,
          tabBarInactiveTintColor: '#374151',
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarLabel: () => null,
          tabBarItemStyle: { paddingVertical: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name="home"
                size={size ?? 24}
                label="Home"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Saved',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name="bookmark-outline"
                size={size ?? 24}
                label="Saved"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Chat',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name="chatbubble-ellipses-outline"
                size={size ?? 24}
                label="Chat"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name="person-outline"
                size={size ?? 24}
                label="Profile"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="explore"
          options={{ href: null }}
        />
      </Tabs>
    );
  }

  if (role === 'EMPLOYER') {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: APP_COLORS.primary,
          tabBarInactiveTintColor: '#374151',
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarLabel: () => null,
          tabBarItemStyle: { paddingVertical: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill focused={focused} tintColor={color} name="home" size={size ?? 24} label="Home" />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: 'My Jobs',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill focused={focused} tintColor={color} name="briefcase-outline" size={size ?? 24} label="My Jobs" />
            ),
          }}
        />
        <Tabs.Screen
          name="applications"
          options={{
            title: 'Applications',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill focused={focused} tintColor={color} name="document-text-outline" size={size ?? 24} label="Applications" />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: 'Messages',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill focused={focused} tintColor={color} name="chatbubble-ellipses-outline" size={size ?? 24} label="Messages" />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill focused={focused} tintColor={color} name="person-outline" size={size ?? 24} label="Profile" />
            ),
          }}
        />
      </Tabs>
    );
  }

  return null;
}
