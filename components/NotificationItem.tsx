import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Gift, Users, Bell, Clock } from 'lucide-react-native';
import colors from '@/constants/colors';
import { NotificationType } from '@/stores/notificationStore';

type NotificationItemProps = {
  notification: NotificationType;
  onPress?: () => void;
};

const NotificationItem = ({ notification, onPress }: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'gift':
        return <Gift size={20} color={colors.primary} />;
      case 'family':
        return <Users size={20} color={colors.secondary} />;
      case 'system':
        return <Bell size={20} color={colors.warning} />;
      default:
        return <Bell size={20} color={colors.gray} />;
    }
  };

  const getTypeLabel = () => {
    switch (notification.type) {
      case 'gift':
        return 'Regalo';
      case 'family':
        return 'Familia';
      case 'system':
        return 'Sistema';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{notification.title}</Text>
          {!notification.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.typeLabel}>{getTypeLabel()}</Text>
          <Text style={styles.time}>
            {new Date(notification.createdAt).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: colors.primaryLight + '10',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 12,
    color: colors.textLight,
    backgroundColor: colors.lightGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
});

export default NotificationItem;
