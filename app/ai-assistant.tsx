import React from 'react';
import { Stack } from 'expo-router';
import AIAssistant from '@/components/AIAssistant';
import colors from '@/constants/colors';

export default function AIAssistantScreen() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Asistente IA',
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
        }}
      />
      
      <AIAssistant />
    </>
  );
}