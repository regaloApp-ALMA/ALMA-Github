import React, { useMemo } from 'react';
import { View, Dimensions, TouchableOpacity, Text, Animated, ScrollView, Platform } from 'react-native';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { BranchType, FruitType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';
import { styles } from './_Tree.styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth;
const CANVAS_HEIGHT = screenHeight * 0.8;

const BRANCH_COLORS: Record<string, string> = {
  family: '#FF6B35',
  travel: '#4A90E2',
  work: '#E91E63',
  education: '#9B59B6',
  friends: '#2ECC71',
  pets: '#00B8D9',
  hobbies: '#27AE60',
  vida: '#8E44AD',
};

type TreeProps = {
  onBranchPress?: (branch: BranchType) => void;
  onFruitPress?: (fruit: FruitType) => void;
  onRootPress?: (root: RootType) => void;
};

const Tree = ({ onBranchPress, onFruitPress, onRootPress }: TreeProps) => {
  const { tree } = useTreeStore();
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDarkMode = theme === 'dark';

  const center = useMemo(() => ({ x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.40 }), []);

  const arrangedBranches = useMemo(() => {
    const list = tree.branches;
    const count = list.length;
    const baseRadius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.32;
    return list.map((b, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
      const x = center.x + baseRadius * Math.cos(angle);
      const y = center.y + baseRadius * Math.sin(angle);
      return { b, x, y };
    });
  }, [tree.branches, center.x, center.y]);

  const handleBranchPress = (branch: BranchType) => {
    if (onBranchPress) return onBranchPress(branch);
    router.push({ pathname: '/branch-details', params: { id: branch.id } });
  };

  const handleFruitPress = (fruit: FruitType) => {
    if (onFruitPress) return onFruitPress(fruit);
    router.push({ pathname: '/fruit-details', params: { id: fruit.id } });
  };

  const handleRootPress = (root: RootType) => {
    if (onRootPress) return onRootPress(root);
    router.push({ pathname: '/root-details', params: { id: root.id } });
  };

  const actualRoots = useMemo(() => tree.roots.slice(0, 5), [tree.roots]);

  return (
    <ScrollView
      style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }]}
      contentContainerStyle={{ minHeight: screenHeight, alignItems: 'center', paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#fff' }]} testID="tree-screen">
        <View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, position: 'relative' }]} testID="tree-canvas">
          <View style={[styles.titleContainer, { top: 20 }]} testID="tree-title">
            <Text style={[styles.titleText, { color: isDarkMode ? '#fff' : '#333' }]}>Mi Árbol de Vida</Text>
          </View>

          <Animated.View
            testID="tree-center"
            style={[
              {
                position: 'absolute',
                left: center.x - 40,
                top: center.y - 40,
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: BRANCH_COLORS.vida,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 10,
                borderWidth: 4,
                borderColor: '#fff',
              },
            ]}
          >
            <Text style={[{ color: '#fff', fontSize: 18, fontWeight: 'bold' }]}>Vida</Text>
          </Animated.View>

          {arrangedBranches.map(({ b, x, y }) => {
            const fruitList = tree.fruits.filter((f) => f.branchId === b.id);
            const color = BRANCH_COLORS[b.categoryId] ?? b.color ?? colors.primary;
            const fruitCount = fruitList.length;
            return (
              <React.Fragment key={b.id}>
                <View
                  style={[
                    {
                      position: 'absolute',
                      left: x - 35,
                      top: y - 35,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      {
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: color,
                        justifyContent: 'center',
                        alignItems: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 8,
                        borderWidth: 3,
                        borderColor: '#fff',
                      },
                    ]}
                    onPress={() => handleBranchPress(b)}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir rama ${b.name}`}
                    testID={`branch-${b.id}`}
                  >
                    <Text style={[{ color: '#fff', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }]}>
                      {b.name.length > 9 ? b.name.substring(0, 9) + '…' : b.name}
                    </Text>
                  </TouchableOpacity>
                </View>

                {fruitList.map((fruit, fruitIndex) => {
                  const ringR = 48;
                  const angle = (fruitIndex / Math.max(fruitCount, 4)) * Math.PI * 2;
                  const fx = x + ringR * Math.cos(angle);
                  const fy = y + ringR * Math.sin(angle);
                  return (
                    <View
                      key={fruit.id}
                      style={{ position: 'absolute', left: fx - 10, top: fy - 10 }}
                      testID={`fruit-${fruit.id}`}
                    >
                      <TouchableOpacity
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: color,
                          borderWidth: 2,
                          borderColor: '#fff',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 3,
                          elevation: 4,
                        }}
                        onPress={() => handleFruitPress(fruit)}
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir recuerdo ${fruit.title}`}
                        testID={`fruit-${fruit.id}-button`}
                      />
                    </View>
                  );
                })}
              </React.Fragment>
            );
          })}

          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 12, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {actualRoots.map((root) => (
                <TouchableOpacity
                  key={root.id}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    backgroundColor: Platform.OS === 'web' ? '#8B4513' : '#8B4513',
                    borderRadius: 14,
                  }}
                  onPress={() => handleRootPress(root)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver raíz ${root.name}`}
                  testID={`root-${root.id}`}
                >
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>{root.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Tree;
