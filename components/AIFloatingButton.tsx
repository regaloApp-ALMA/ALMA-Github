import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';

const AIFloatingButton = () => {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const handlePress = () => {
    router.push('/ai-assistant');
  };

  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        isDarkMode && styles.floatingButtonDark
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MessageCircle 
        size={26} 
        color={colors.white} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 110,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000,
  },
  floatingButtonDark: {
    backgroundColor: colors.secondary,
  },
});

export default AIFloatingButton;