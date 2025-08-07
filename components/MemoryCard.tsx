import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'lucide-react-native';
import colors from '@/constants/colors';

type MemoryCardProps = {
  title: string;
  description: string;
  onPress?: () => void;
  isDarkMode?: boolean;
};

const MemoryCard = ({ title, description, onPress, isDarkMode }: MemoryCardProps) => {
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.iconContainer}>
        <Calendar size={24} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>{title}</Text>
        <Text style={[styles.description, isDarkMode && styles.descriptionDark]}>{description}</Text>
        {onPress && (
          <TouchableOpacity style={styles.button} onPress={onPress}>
            <Text style={styles.buttonText}>Añadir recuerdo</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
    shadowColor: '#000',
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  titleDark: {
    color: colors.white,
  },
  description: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 12,
  },
  descriptionDark: {
    color: '#AAA',
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default MemoryCard;