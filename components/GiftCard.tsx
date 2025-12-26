import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gift, Clock } from 'lucide-react-native';
import colors from '@/constants/colors';
import { GiftType } from '@/types/gift';

type GiftCardProps = {
  gift: GiftType;
  onAccept?: () => void;
  onReject?: () => void;
};

const GiftCard = ({ gift, onAccept, onReject }: GiftCardProps) => {
  const isTimeCapsule = gift.type === 'timeCapsule';
  const isPending = gift.status === 'pending';

  // Calculate time until unlock for time capsules
  const getTimeUntilUnlock = () => {
    if (!gift.unlockDate) return '';
    
    const unlockDate = new Date(gift.unlockDate);
    const now = new Date();
    
    const diffTime = Math.abs(unlockDate.getTime() - now.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffMonths > 0) {
      return `${diffMonths} meses y ${diffDays % 30} días`;
    }
    
    return `${diffDays} días`;
  };

  return (
    <View style={[
      styles.container, 
      { borderLeftColor: isTimeCapsule ? colors.warning : colors.accent }
    ]}>
      {gift.isNew && <View style={styles.newBadge} />}
      
      <View style={styles.header}>
        <Text style={styles.badge}>{isTimeCapsule ? 'Nuevo' : 'Nuevo'}</Text>
        <View style={styles.iconContainer}>
          {isTimeCapsule ? (
            <Clock size={24} color={colors.warning} />
          ) : (
            <Gift size={24} color={colors.accent} />
          )}
        </View>
      </View>
      
      <Text style={styles.title}>
        {gift.contentData?.title || gift.contentId || 'Regalo'}
      </Text>
      
      <Text style={styles.sender}>De: {gift.senderName}</Text>
      
      <Text style={styles.message}>"{gift.message}"</Text>
      
      {isTimeCapsule && gift.unlockDate && (
        <Text style={styles.unlockInfo}>Se abrirá en: {getTimeUntilUnlock()}</Text>
      )}
      
      {isPending && !isTimeCapsule && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.rejectButton]} 
            onPress={onReject}
          >
            <Text style={styles.rejectButtonText}>Rechazar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]} 
            onPress={onAccept}
          >
            <Text style={styles.acceptButtonText}>Aceptar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    position: 'relative',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    fontSize: 12,
    color: colors.textLight,
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  iconContainer: {
    marginLeft: 'auto',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  sender: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  unlockInfo: {
    fontSize: 14,
    color: colors.warning,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  rejectButton: {
    backgroundColor: colors.lightGray,
  },
  rejectButtonText: {
    color: colors.textLight,
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    backgroundColor: colors.primary,
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default GiftCard;