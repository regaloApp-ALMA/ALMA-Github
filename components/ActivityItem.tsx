import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import colors from '@/constants/colors';

type ActivityItemProps = {
  userInitial: string;
  userName: string;
  action: string;
  timeAgo: string;
  onPress?: () => void;
  isDarkMode?: boolean;
};

const ActivityItem = ({ userInitial, userName, action, timeAgo, onPress, isDarkMode }: ActivityItemProps) => {
  return (
    <TouchableOpacity style={[styles.container, isDarkMode && styles.containerDark]} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{userInitial}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.text, isDarkMode && styles.textDark]}>
          <Text style={[styles.name, isDarkMode && styles.nameDark]}>{userName}</Text> {action}
        </Text>
        <Text style={[styles.time, isDarkMode && styles.timeDark]}>{timeAgo}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  containerDark: {
    borderBottomColor: '#333',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  textDark: {
    color: colors.white,
  },
  name: {
    fontWeight: 'bold',
  },
  nameDark: {
    color: colors.white,
  },
  time: {
    fontSize: 12,
    color: colors.textLight,
  },
  timeDark: {
    color: '#AAA',
  },
});

export default ActivityItem;