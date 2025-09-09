import React, { useMemo } from 'react';
import { View, Dimensions, TouchableOpacity, Text, Animated, ScrollView, StyleSheet } from 'react-native';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { BranchType, FruitType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import { useThemeStore } from '@/stores/themeStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CANVAS_WIDTH = screenWidth;
const CANVAS_HEIGHT = screenHeight * 0.9;

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

const TRUNK_COLOR = '#8B4513';
const BRANCH_CONNECTOR_COLOR = '#A0522D';
const ROOT_COLOR = '#654321';

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

  const center = useMemo(() => ({ x: CANVAS_WIDTH * 0.5, y: CANVAS_HEIGHT * 0.45 }), []);

  const arrangedBranches = useMemo(() => {
    const list = tree.branches;
    const count = list.length;
    const baseRadius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) * 0.28;
    return list.map((b, i) => {
      const angle = (i / Math.max(count, 1)) * Math.PI * 2 - Math.PI / 2;
      const radiusVariation = 1 + (Math.sin(i * 2.5) * 0.15); // Organic variation
      const actualRadius = baseRadius * radiusVariation;
      const x = center.x + actualRadius * Math.cos(angle);
      const y = center.y + actualRadius * Math.sin(angle);
      return { b, x, y, angle, radius: actualRadius };
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
      style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#f8f9fa' }]}
      contentContainerStyle={{ minHeight: screenHeight, alignItems: 'center', paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[{ flex: 1, backgroundColor: isDarkMode ? '#000' : '#f8f9fa' }]} testID="tree-screen">
        <View style={[{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, position: 'relative' }]} testID="tree-canvas">
          <View style={[stylesLocal.titleContainer]} testID="tree-title">
            <Text style={[stylesLocal.titleText, { color: isDarkMode ? '#fff' : '#2c3e50' }]}>Mi Árbol de Vida</Text>
            <Text style={[stylesLocal.subtitleText, { color: isDarkMode ? '#aaa' : '#7f8c8d' }]}>Cada rama cuenta tu historia</Text>
          </View>

          {/* Tronco principal */}
          <View
            style={[
              stylesLocal.mainTrunk,
              { 
                left: center.x - 8, 
                top: center.y + 45, 
                height: CANVAS_HEIGHT * 0.35 
              },
            ]}
            pointerEvents="none"
          />

          {/* Conexiones orgánicas desde el centro a cada rama */}
          {arrangedBranches.map(({ b, x, y, angle, radius }) => {
            const dx = x - center.x;
            const dy = y - center.y;
            const length = Math.max(radius - 45, 0);
            const rotation = Math.atan2(dy, dx);
            const thickness = 3 + Math.random() * 2; // Variación orgánica
            return (
              <View
                key={`conn-${b.id}`}
                style={[
                  stylesLocal.branchConnector,
                  {
                    left: center.x,
                    top: center.y - thickness/2,
                    width: length,
                    height: thickness,
                    transform: [{ rotateZ: `${rotation}rad` }],
                  },
                ]}
                pointerEvents="none"
              />
            );
          })}

          {/* Centro del árbol - Núcleo de vida */}
          <Animated.View
            testID="tree-center"
            style={[
              stylesLocal.treeCenter,
              {
                left: center.x - 45,
                top: center.y - 45,
              },
            ]}
          >
            <View style={stylesLocal.centerInner}>
              <Text style={stylesLocal.centerText}>🌳</Text>
              <Text style={stylesLocal.centerLabel}>Vida</Text>
            </View>
          </Animated.View>

          {/* Ramas y frutos */}
          {arrangedBranches.map(({ b, x, y }) => {
            const fruitList = tree.fruits.filter((f) => f.branchId === b.id);
            const color = BRANCH_COLORS[b.categoryId] ?? b.color ?? colors.primary;
            const fruitCount = fruitList.length;
            return (
              <React.Fragment key={b.id}>
                {/* Rama principal */}
                <View
                  style={[
                    stylesLocal.branchContainer,
                    {
                      left: x - 40,
                      top: y - 40,
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      stylesLocal.branchButton,
                      { backgroundColor: color },
                    ]}
                    onPress={() => handleBranchPress(b)}
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir rama ${b.name}`}
                    testID={`branch-${b.id}`}
                  >
                    <Text style={stylesLocal.branchText}>
                      {b.name.length > 8 ? b.name.substring(0, 8) + '…' : b.name}
                    </Text>
                    {fruitCount > 0 && (
                      <View style={stylesLocal.fruitCounter}>
                        <Text style={stylesLocal.fruitCounterText}>{fruitCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Frutos alrededor de cada rama */}
                {fruitList.map((fruit, fruitIndex) => {
                  const ringRadius = 60 + (fruitIndex % 2) * 15; // Anillos concéntricos
                  const angle = (fruitIndex / Math.max(fruitCount, 1)) * Math.PI * 2 + (fruitIndex * 0.5);
                  const fx = x + ringRadius * Math.cos(angle);
                  const fy = y + ringRadius * Math.sin(angle);
                  return (
                    <View
                      key={fruit.id}
                      style={[stylesLocal.fruitWrapper, { left: fx - 12, top: fy - 12 }]}
                      testID={`fruit-${fruit.id}`}
                    >
                      <TouchableOpacity
                        style={[
                          stylesLocal.fruitDot,
                          { backgroundColor: color },
                        ]}
                        onPress={() => handleFruitPress(fruit)}
                        accessibilityRole="button"
                        accessibilityLabel={`Abrir recuerdo ${fruit.title}`}
                        testID={`fruit-${fruit.id}-button`}
                      >
                        <Text style={stylesLocal.fruitEmoji}>🍎</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Sistema de raíces mejorado */}
          <View style={stylesLocal.rootsContainer}>
            <Text style={[stylesLocal.rootsTitle, { color: isDarkMode ? '#fff' : '#2c3e50' }]}>Raíces Familiares</Text>
            <View style={stylesLocal.rootsGrid}>
              {actualRoots.map((root, index) => (
                <TouchableOpacity
                  key={root.id}
                  style={[
                    stylesLocal.rootCard,
                    { backgroundColor: isDarkMode ? '#2c3e50' : '#fff' }
                  ]}
                  onPress={() => handleRootPress(root)}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver raíz ${root.name}`}
                  testID={`root-${root.id}`}
                >
                  <Text style={stylesLocal.rootEmoji}>🌱</Text>
                  <Text style={[stylesLocal.rootCardText, { color: isDarkMode ? '#fff' : '#2c3e50' }]}>
                    {root.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Raíces subterráneas decorativas */}
          {[...Array(3)].map((_, i) => (
            <View
              key={`root-line-${i}`}
              style={[
                stylesLocal.rootLine,
                {
                  left: center.x - 20 + i * 20,
                  top: center.y + 80 + i * 30,
                  width: 40 + i * 10,
                  transform: [{ rotateZ: `${(i - 1) * 15}deg` }],
                },
              ]}
              pointerEvents="none"
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const stylesLocal = StyleSheet.create({
  titleContainer: {
    position: 'absolute',
    top: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  mainTrunk: {
    position: 'absolute',
    width: 16,
    backgroundColor: TRUNK_COLOR,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  branchConnector: {
    position: 'absolute',
    backgroundColor: BRANCH_CONNECTOR_COLOR,
    borderRadius: 2,
    opacity: 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  treeCenter: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 4,
    borderColor: '#e8f5e8',
  },
  centerInner: {
    alignItems: 'center',
  },
  centerText: {
    fontSize: 32,
    marginBottom: 4,
  },
  centerLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  branchContainer: {
    position: 'absolute',
  },
  branchButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  branchText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 16,
  },
  fruitCounter: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e8f5e8',
  },
  fruitCounterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  fruitWrapper: {
    position: 'absolute',
  },
  fruitDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fruitEmoji: {
    fontSize: 12,
  },
  rootsContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 40,
    alignItems: 'center',
  },
  rootsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  rootsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  rootCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 80,
  },
  rootEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  rootCardText: {
    fontSize: 14,
    fontWeight: '600',
  },
  rootLine: {
    position: 'absolute',
    height: 3,
    backgroundColor: ROOT_COLOR,
    borderRadius: 2,
    opacity: 0.6,
  },
});

export default Tree;
