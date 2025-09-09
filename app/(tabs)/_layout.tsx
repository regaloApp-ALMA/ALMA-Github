import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Leaf, Gift, User } from 'lucide-react-native';
import colors from '@/constants/colors';
import AddButton from '@/components/AddButton';
import AIFloatingButton from '@/components/AIFloatingButton';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useGiftStore } from '@/stores/giftStore';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth } = Dimensions.get('window');

export default function TabLayout() {
  const { gifts } = useGiftStore();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';
  const unreadGifts = gifts.filter(gift => gift.isNew).length;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: isDarkMode ? '#AAA' : colors.gray,
          tabBarStyle: {
            height: 90,
            paddingBottom: 25,
            paddingTop: 15,
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.white,
            borderTopColor: isDarkMode ? '#333' : colors.lightGray,
            borderTopWidth: 1,
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          headerStyle: {
            backgroundColor: isDarkMode ? '#1E1E1E' : colors.background,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleStyle: {
            color: isDarkMode ? colors.white : colors.text,
            fontWeight: 'bold',
            fontSize: 18,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Inicio',
            tabBarIcon: ({ color }) => <Home size={24} color={color} />,
            tabBarLabel: 'Inicio',
          }}
        />
        <Tabs.Screen
          name="tree"
          options={{
            title: 'Mi Árbol',
            tabBarIcon: ({ color }) => <Leaf size={24} color={color} />,
            tabBarLabel: 'Mi Árbol',
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarButton: () => null, // Hide the default tab button
          }}
        />
        <Tabs.Screen
          name="gifts"
          options={{
            title: 'Regalos',
            tabBarIcon: ({ color }) => (
              <View>
                <Gift size={24} color={color} />
                {unreadGifts > 0 && (
                  <View style={styles.badge}>
                    <View style={styles.badgeInner}>
                      <View style={styles.badgeDot} />
                    </View>
                  </View>
                )}
              </View>
            ),
            tabBarLabel: 'Regalos',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Perfil',
            tabBarIcon: ({ color }) => <User size={24} color={color} />,
            tabBarLabel: 'Perfil',
          }}
        />
      </Tabs>
      <View style={styles.addButtonContainer} pointerEvents="box-none">
        <AddButton />
      </View>
      <AIFloatingButton />
    </>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    position: 'absolute',
    bottom: 38,
    left: screenWidth * 0.5 - 32, // Centrado exacto
    zIndex: 100,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.white,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeInner: {
    backgroundColor: colors.error,
    borderRadius: 6,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeDot: {
    backgroundColor: colors.white,
    borderRadius: 2,
    width: 4,
    height: 4,
  },
});