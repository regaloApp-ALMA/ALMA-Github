import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Tree from '@/components/Tree';
import colors from '@/constants/colors';
import { useTreeStore } from '@/stores/treeStore';

export default function TreeScreen() {
  const { tree, fetchMyTree, isLoading } = useTreeStore();

  useEffect(() => {
    if (!tree && !isLoading) {
      fetchMyTree();
    }
  }, [fetchMyTree, isLoading, tree]);

  return (
    <View style={styles.container}>
      <Tree />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
