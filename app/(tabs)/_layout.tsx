import { HapticTab } from "@/components/haptic-tab";
import { useAuth } from "@/contexts/AuthContext";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const iconColor = focused ? "#FFFFFF" : "#6B7280";
  const iconSize = focused ? ACTIVE_ICON_SIZE : (size ?? INACTIVE_ICON_SIZE);

  if (focused) {
    return (
      <View style={styles.pill}>
        <Ionicons name={name} size={iconSize} color={iconColor} />
        <Text style={styles.pillText} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.iconOnly}>
      <Ionicons name={name} size={iconSize} color={iconColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    backgroundColor: "#1E4655",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    minWidth: 80,
  },
  pillText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  iconOnly: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
  },
});

/** FAB above tab bar (employer only) - right corner, not inside the tab bar */
const FAB_OFFSET_BOTTOM = 12;
const fabFloatingStyle = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#96BED2",
    borderWidth: 1,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
});

const TAB_BAR_BASE = {
  backgroundColor: "#F5F5F5",
  borderTopWidth: 0,
  borderTopColor: "#E5E7EB",
  elevation: 4,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 4,
  paddingTop: 8,
  borderRadius: 40,
  marginHorizontal: 10,
  paddingHorizontal: 13,
};

export default function TabLayout() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Keep tab bar above device nav buttons: use safe area + gap, or minimum 48px when inset is 0 (e.g. some Android)
  const tabBarBottom = Math.max(insets.bottom + 16, 48);
  const tabBarStyle = {
    ...TAB_BAR_BASE,
    height: 64,
    paddingBottom: 8,
    bottom: tabBarBottom,
  };

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const role = user.role ?? "CANDIDATE";
  if (role === "ADMIN") {
    return (
      <Tabs
        sceneContainerStyle={{ backgroundColor: '#fff' }}
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "rgba(255,255,255,0.65)",
          tabBarShowLabel: true,
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
          tabBarLabel: ({ focused, children }) => (focused ? children : null),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" size={size ?? 24} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  }

  if (role === "CANDIDATE") {
    return (
      <Tabs
        sceneContainerStyle={{ backgroundColor: '#fff' }}
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarStyle,
          tabBarActiveTintColor: "#FFFFFF",
          tabBarInactiveTintColor: "#6B7280",
          tabBarShowLabel: false,
          tabBarItemStyle: { paddingVertical: 4 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name={focused ? "home" : "home-outline"}
                size={size ?? 24}
                label="Home"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="jobs"
          options={{
            title: "Jobs",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name={focused ? "bookmark" : "bookmark-outline"}
                size={size ?? 24}
                label="Jobs"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="chats"
          options={{
            title: "Chats",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                size={size ?? 24}
                label="Chats"
              />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused, color, size }) => (
              <TabIconWithPill
                focused={focused}
                tintColor={color}
                name={focused ? "person" : "person-outline"}
                size={size ?? 24}
                label="Profile"
              />
            ),
          }}
        />
        <Tabs.Screen name="applications" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
        <Tabs.Screen name="interviews" options={{ href: null }} />
        <Tabs.Screen name="post" options={{ href: null }} />
      </Tabs>
    );
  }

  if (role === "EMPLOYER") {
    const fabBottom = tabBarBottom + 64 + FAB_OFFSET_BOTTOM;
    return (
      <View style={{ flex: 1 }}>
        <Tabs
          sceneContainerStyle={{ backgroundColor: "#fff" }}
          screenOptions={{
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle,
            tabBarActiveTintColor: "#FFFFFF",
            tabBarInactiveTintColor: "#6B7280",
            tabBarShowLabel: false,
            tabBarItemStyle: { paddingVertical: 4 },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: "Home",
              tabBarIcon: ({ focused, color, size }) => (
                <TabIconWithPill
                  focused={focused}
                  tintColor={color}
                  name={focused ? "home" : "home-outline"}
                  size={size ?? 24}
                  label="Home"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="interviews"
            options={{
              title: "Interviews",
              tabBarIcon: ({ focused, color, size }) => (
                <TabIconWithPill
                  focused={focused}
                  tintColor={color}
                  name={focused ? "calendar" : "calendar-outline"}
                  size={size ?? 24}
                  label="Interviews"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="chats"
            options={{
              title: "Chats",
              tabBarIcon: ({ focused, color, size }) => (
                <TabIconWithPill
                  focused={focused}
                  tintColor={color}
                  name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"}
                  size={size ?? 24}
                  label="Chats"
                />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: "Profile",
              tabBarIcon: ({ focused, color, size }) => (
                <TabIconWithPill
                  focused={focused}
                  tintColor={color}
                  name={focused ? "person" : "person-outline"}
                  size={size ?? 24}
                  label="Profile"
                />
              ),
            }}
          />
          <Tabs.Screen name="post" options={{ href: null }} />
          <Tabs.Screen name="jobs" options={{ href: null }} />
          <Tabs.Screen name="applications" options={{ href: null }} />
          <Tabs.Screen name="explore" options={{ href: null }} />
        </Tabs>
        <TouchableOpacity
          style={[fabFloatingStyle.fab, { bottom: fabBottom }]}
          onPress={() => router.push("/post-job")}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={28} color="#333333" />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}
