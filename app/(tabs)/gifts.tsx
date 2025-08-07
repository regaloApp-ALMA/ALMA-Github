import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useGiftStore } from '@/stores/giftStore';
import { useUserStore } from '@/stores/userStore';
import GiftCard from '@/components/GiftCard';
import colors from '@/constants/colors';
import { Gift } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

export default function GiftsScreen() {
  const { gifts, fetchGifts, acceptGift, rejectGift } = useGiftStore();
  const { user } = useUserStore();
  const { theme } = useThemeStore();
  const router = useRouter();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (user) {
      fetchGifts(user.id);
    }
  }, [user]);

  const handleAcceptGift = (id: string) => {
    acceptGift(id);
  };

  const handleRejectGift = (id: string) => {
    rejectGift(id);
  };

  const handleCreateGift = () => {
    router.push('/create-gift');
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.createGiftSection, isDarkMode && styles.createGiftSectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Crea un regalo especial</Text>
        <Text style={[styles.sectionDescription, isDarkMode && styles.sectionDescriptionDark]}>
          Regala una rama de recuerdos, un árbol personalizado o una cápsula del tiempo a alguien especial.
        </Text>
        
        <TouchableOpacity style={[styles.createButton, isDarkMode && styles.createButtonDark]} onPress={handleCreateGift}>
          <Gift size={20} color={colors.white} />
          <Text style={styles.createButtonText}>Crear nuevo regalo</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.receivedSection, isDarkMode && styles.receivedSectionDark]}>
        <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Regalos recibidos</Text>
        
        {gifts.length === 0 ? (
          <View style={[styles.emptyState, isDarkMode && styles.emptyStateDark]}>
            <Text style={[styles.emptyStateText, isDarkMode && styles.emptyStateTextDark]}>No tienes regalos recibidos</Text>
          </View>
        ) : (
          gifts.map((gift) => (
            <GiftCard
              key={gift.id}
              gift={gift}
              onAccept={() => handleAcceptGift(gift.id)}
              onReject={() => handleRejectGift(gift.id)}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  createGiftSection: {
    backgroundColor: colors.primaryLight,
    padding: 20,
    borderRadius: 12,
    margin: 16,
  },
  createGiftSectionDark: {
    backgroundColor: colors.primary + '20',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: colors.white,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 16,
  },
  sectionDescriptionDark: {
    color: '#AAA',
  },
  createButton: {
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  createButtonDark: {
    backgroundColor: colors.secondary,
  },
  createButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  receivedSection: {
    padding: 16,
  },
  receivedSectionDark: {
    backgroundColor: 'transparent',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateDark: {
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    color: colors.textLight,
    fontSize: 16,
  },
  emptyStateTextDark: {
    color: '#AAA',
  },
});