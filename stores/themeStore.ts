import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, StatusBar } from 'react-native';
import colors from '@/constants/colors';

type ThemeType = 'light' | 'dark';

interface ThemeState {
  theme: ThemeType;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      
      toggleTheme: () => {
        set((state) => {
          const newTheme = state.theme === 'light' ? 'dark' : 'light';
          
          // Update status bar on mobile
          if (Platform.OS === 'ios' || Platform.OS === 'android') {
            StatusBar.setBarStyle(newTheme === 'dark' ? 'light-content' : 'dark-content');
            if (Platform.OS === 'android') {
              StatusBar.setBackgroundColor(newTheme === 'dark' ? '#121212' : colors.background);
            }
          }
          
          return { theme: newTheme };
        });
      },
      
      setTheme: (theme) => {
        // Update status bar on mobile
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          StatusBar.setBarStyle(theme === 'dark' ? 'light-content' : 'dark-content');
          if (Platform.OS === 'android') {
            StatusBar.setBackgroundColor(theme === 'dark' ? '#121212' : colors.background);
          }
        }
        
        set({ theme });
      },
    }),
    {
      name: 'alma-theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);