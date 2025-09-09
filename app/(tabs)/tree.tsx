import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import Tree from '@/components/Tree';
import colors from '@/constants/colors';
import { useTreeStore } from '@/stores/treeStore';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const { height: screenHeight } = Dimensions.get('window');

export default function TreeScreen() {
  const { tree } = useTreeStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const handleBranchPress = (branch: any) => {
    router.push({
      pathname: '/branch-details',
      params: { id: branch.id },
    });
  };

  const handleFruitPress = (fruit: any) => {
    router.push({
      pathname: '/fruit-details',
      params: { id: fruit.id },
    });
  };

  const handleRootPress = (root: any) => {
    router.push({
      pathname: '/root-details',
      params: { id: root.id },
    });
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.header}>
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>{tree.name}</Text>
        <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>
          Explora tus recuerdos y conexiones familiares
        </Text>
      </View>
      
      <View style={styles.treeContainer}>
        <Tree 
          onBranchPress={handleBranchPress}
          onFruitPress={handleFruitPress}
          onRootPress={handleRootPress}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
    height: 0,
    overflow: 'hidden',
    display: 'none',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  titleDark: {
    color: colors.white,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  subtitleDark: {
    color: '#AAA',
  },
  treeContainer: {
    flex: 1,
  },
});