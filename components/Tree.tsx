import React, { memo, useMemo, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator, Share } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTreeStore } from '@/stores/treeStore';
import { BranchType, RootType, TreeType } from '@/types/tree';
import { useRouter, useFocusEffect } from 'expo-router';
import colors from '@/constants/colors';
import { Sprout } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ════════════════════════════════════════════════════════════════════════════════
// 🎨 CONFIGURACIÓN DE DISEÑO
// ════════════════════════════════════════════════════════════════════════════════

// Tipo extendido para ramas con layout calculado
type LayoutBranchType = BranchType & {
    x: number;
    y: number;
    path: string;
    fruitCount: number;
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 2400; // Mayor altura para árboles grandes
const CENTER_X = CANVAS_WIDTH / 2;
const BASE_Y = CANVAS_HEIGHT - 200; // Base del tronco

// Paleta de colores orgánicos
const DESIGN_THEME = {
    bg: '#F3F0E9',
    trunk: '#8D6E63',
    trunkLight: '#A1887F',
    trunkDark: '#6D4C41',
    ground: '#E8E6DC',
    foliage: '#C8E6C9',
    textDark: '#2D3436',
};

// ════════════════════════════════════════════════════════════════════════════════
// 🧮 FUNCIONES MATEMÁTICAS PARA GEOMETRÍA ORGÁNICA
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Genera un tronco orgánico que se estrecha hacia arriba
 */
const generateDynamicTrunkPath = (centerX: number, baseY: number, height: number): string => {
    const topY = baseY - height;
    const baseWidth = 44;
    const topWidth = 16;

    // Puntos de control para curvas suaves
    const midY = baseY - height * 0.5;

    return `
        M ${centerX - baseWidth / 2} ${baseY}
        C ${centerX - baseWidth / 2 - 4} ${baseY - 250}, 
          ${centerX - 20} ${midY}, 
          ${centerX - topWidth / 2} ${topY}
        L ${centerX + topWidth / 2} ${topY}
        C ${centerX + 20} ${midY}, 
          ${centerX + baseWidth / 2 + 4} ${baseY - 250}, 
          ${centerX + baseWidth / 2} ${baseY}
        Z
    `;
};

/**
 * Genera una curva Bézier cuadrática suave para una rama
 */
const generateCurvedBranchPath = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
): string => {
    // Punto de control: misma altura que el destino, en el eje X del tronco
    const controlX = startX;
    const controlY = endY;

    return `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
};

// ════════════════════════════════════════════════════════════════════════════════
// 🧩 COMPONENTES INTERACTIVOS
// ════════════════════════════════════════════════════════════════════════════════

const BranchBubble = memo(({
    branch,
    x,
    y,
    onPress,
    fruitCount
}: {
    branch: LayoutBranchType;
    x: number;
    y: number;
    onPress: (b: BranchType) => void;
    fruitCount: number;
}) => (
    <View style={{
        position: 'absolute',
        left: x - 45,
        top: y - 45,
        width: 90,
        height: 90,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1
    }}>
        {fruitCount > 0 && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{fruitCount}</Text>
            </View>
        )}

        <TouchableOpacity
            style={[
                styles.branchCircle,
                { backgroundColor: branch.color || colors.primary }
            ]}
            onPress={() => onPress(branch)}
            activeOpacity={0.8}
        >
            <View style={styles.branchBorder} />
            <Text style={styles.branchText} numberOfLines={2} adjustsFontSizeToFit>
                {branch.name}
            </Text>
        </TouchableOpacity>
    </View>
));

const RootCard = memo(({ root, onPress }: { root: RootType; onPress: (r: RootType) => void }) => (
    <TouchableOpacity style={styles.rootCard} onPress={() => onPress(root)}>
        <View style={styles.rootIconContainer}>
            <Sprout size={18} color="#5D4037" />
        </View>
        <View>
            <Text style={styles.rootName}>{root.name}</Text>
            <Text style={styles.rootRelation}>{root.relation}</Text>
        </View>
    </TouchableOpacity>
));

// ════════════════════════════════════════════════════════════════════════════════
// 🌳 COMPONENTE PRINCIPAL
// ════════════════════════════════════════════════════════════════════════════════

type TreeProps = {
    treeData?: TreeType | null;
    isShared?: boolean;
};

export default function Tree({ treeData, isShared = false }: TreeProps = {}) {
    const { tree: storeTree, isLoading, fetchMyTree } = useTreeStore();
    const router = useRouter();
    const zoomRef = useRef<any>(null);

    // 🎯 AUTO-CENTRADO AL ENFOCAR
    useFocusEffect(
        React.useCallback(() => {
            const timer = setTimeout(() => {
                if (zoomRef.current) {
                    try {
                        zoomRef.current.zoomTo(0.6);
                        zoomRef.current.moveTo(0, 300);
                    } catch (e) {
                        console.warn('Error resetting zoom:', e);
                    }
                }
            }, 100);
            return () => clearTimeout(timer);
        }, [])
    );

    const tree = treeData || storeTree;

    useEffect(() => {
        if (!isShared && !treeData) {
            fetchMyTree();
        }
    }, []);

    useEffect(() => {
        if (isShared || treeData) return;
        // @ts-ignore
        const unsubscribe = router.addListener?.('focus', () => {
            fetchMyTree(true);
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, [isShared, treeData]);

    // 🧮 CÁLCULO DINÁMICO DEL ÁRBOL
    const { layoutBranches, trunkPath, foliageCircles } = useMemo(() => {
        if (!tree) return {
            layoutBranches: [],
            trunkPath: '',
            foliageCircles: []
        };

        const branches = tree.branches || [];

        // ═══════════════════════════════════════════════════════════════════
        // PASO 1: LAYOUT DETERMINISTA (ZIG-ZAG) PARA ESTABILIDAD
        // ═══════════════════════════════════════════════════════════════════

        // Ignoramos coordenadas de DB para garantizar visualización perfecta
        const layoutBranches = branches.map((branch, i) => {
            // Algoritmo Zig-Zag basado puramente en índice
            const isLeft = i % 2 === 0;
            const sideMultiplier = isLeft ? -1 : 1;

            // Crecimiento vertical constante
            const verticalSpacing = 140;
            const yOffset = 250 + (i * verticalSpacing);

            // Apertura horizontal
            const xOffset = 200 + (i % 3) * 20; // Leve variación

            // Coordenadas Absolutas
            const endX = CENTER_X + (sideMultiplier * xOffset);
            const endY = BASE_Y - yOffset; // Y crece hacia arriba (se resta)

            // Punto de inicio (Tronco)
            const startX = CENTER_X;
            const startY = endY + 50;

            const path = generateCurvedBranchPath(startX, startY, endX, endY);
            const fruitCount = tree.fruits.filter(f => f.branchId === branch.id).length;

            return {
                ...branch,
                x: endX,
                y: endY,
                path,
                fruitCount
            };
        });

        // ═══════════════════════════════════════════════════════════════════
        // PASO 2: TRONCO INDEPENDIENTE
        // ═══════════════════════════════════════════════════════════════════

        // Altura basada en la cantidad de ramas + un margen
        // Si no hay ramas, altura mínima
        const branchesHeight = branches.length * 140;
        const totalHeight = Math.max(600, branchesHeight + 400);

        const trunkPath = generateDynamicTrunkPath(CENTER_X, BASE_Y, totalHeight);

        // ═══════════════════════════════════════════════════════════════════
        // PASO 3: FOLLAJE
        // ═══════════════════════════════════════════════════════════════════

        const foliageCircles = layoutBranches.flatMap((branch) => {
            const isLeft = branch.x < CENTER_X;
            return [
                {
                    cx: branch.x + (isLeft ? 35 : -35),
                    cy: branch.y - 15,
                    r: 45,
                    opacity: 0.25,
                },
                {
                    cx: branch.x + (isLeft ? 10 : -10),
                    cy: branch.y + 15,
                    r: 38,
                    opacity: 0.2,
                }
            ];
        });

        return { layoutBranches, trunkPath, foliageCircles };
    }, [tree]);

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            <ReactNativeZoomableView
                ref={zoomRef}
                maxZoom={1.5}
                minZoom={0.3}
                zoomStep={0.5}
                initialZoom={0.6}
                bindToBorders={false}
                style={styles.zoomView}
                contentWidth={CANVAS_WIDTH}
                contentHeight={CANVAS_HEIGHT}
                initialOffsetX={-(CANVAS_WIDTH - SCREEN_WIDTH) / 2}
                initialOffsetY={-(CANVAS_HEIGHT - SCREEN_HEIGHT) + 300}
            >
                <View style={styles.canvas}>
                    <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                <Stop offset="0%" stopColor={DESIGN_THEME.trunkDark} />
                                <Stop offset="50%" stopColor={DESIGN_THEME.trunk} />
                                <Stop offset="100%" stopColor={DESIGN_THEME.trunkLight} />
                            </LinearGradient>
                        </Defs>

                        {/* Suelo */}
                        <Path
                            d={`M 0 ${BASE_Y} Q ${CENTER_X} ${BASE_Y - 80} ${CANVAS_WIDTH} ${BASE_Y} V ${CANVAS_HEIGHT} H 0 Z`}
                            fill={DESIGN_THEME.ground}
                        />

                        {/* Follaje sutil */}
                        {foliageCircles.map((circle, idx) => (
                            <Circle
                                key={`foliage-${idx}`}
                                cx={circle.cx}
                                cy={circle.cy}
                                r={circle.r}
                                fill={DESIGN_THEME.foliage}
                                opacity={circle.opacity}
                            />
                        ))}

                        {/* TRONCO */}
                        <Path d={trunkPath} fill="url(#trunkGrad)" />

                        {/* RAMAS */}
                        {layoutBranches.map((b) => (
                            <Path
                                key={`path-${b.id}`}
                                d={b.path}
                                stroke={DESIGN_THEME.trunk}
                                strokeWidth={9}
                                strokeLinecap="round"
                                fill="none"
                            />
                        ))}
                    </Svg>

                    {/* NODOS INTERACTIVOS */}
                    {layoutBranches.map((b) => (
                        <BranchBubble
                            key={b.id}
                            branch={b}
                            x={b.x}
                            y={b.y}
                            fruitCount={b.fruitCount}
                            onPress={(branch) => router.push({
                                pathname: '/branch-details',
                                params: { id: branch.id }
                            })}
                        />
                    ))}
                </View>
            </ReactNativeZoomableView>

            {/* PANEL INFERIOR: Raíces Familiares */}
            {!isShared && (
                <View style={styles.bottomPanel}>
                    <Text style={styles.panelTitle}>Raíces familiares</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.rootsList}
                    >
                        {tree?.roots && tree.roots.length > 0 ? (
                            tree.roots.map((root) => (
                                <RootCard
                                    key={root.id}
                                    root={root}
                                    onPress={(r) => router.push({
                                        pathname: '/root-details',
                                        params: { id: r.id }
                                    })}
                                />
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText} numberOfLines={0}>
                                    Aquí aparecerán tus familiares cuando te compartan su árbol.
                                </Text>
                                <TouchableOpacity
                                    style={styles.inviteCard}
                                    onPress={async () => {
                                        try {
                                            await Share.share({
                                                message: '¡Únete a ALMA para guardar tus recuerdos y compartir tu historia familiar! Descarga la app: https://alma.app',
                                                title: 'Invita a ALMA'
                                            });
                                        } catch (error) {
                                            console.error('Error sharing:', error);
                                        }
                                    }}
                                >
                                    <Text style={styles.inviteText}>Invitar a la App</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

// ════════════════════════════════════════════════════════════════════════════════
// 💅 ESTILOS (Mantenidos igual)
// ════════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN_THEME.bg
    },
    zoomView: {
        width: '100%',
        height: '100%'
    },
    canvas: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    },
    loaderContainer: {
        position: 'absolute',
        top: 100,
        left: 0,
        right: 0,
        zIndex: 100,
        alignItems: 'center',
    },
    branchCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
    },
    branchBorder: {
        position: 'absolute',
        width: 94,
        height: 94,
        borderRadius: 47,
        borderWidth: 2.5,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        top: -2.5,
        left: -2.5,
    },
    branchText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#FFF',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        borderWidth: 2,
        borderColor: '#E8E8E8',
    },
    badgeText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 13
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingVertical: 20,
        paddingHorizontal: 20,
        elevation: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        height: 170,
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: DESIGN_THEME.textDark,
        marginBottom: 12
    },
    rootsList: {
        alignItems: 'center',
        paddingRight: 20
    },
    rootCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 10,
        paddingRight: 16,
        borderRadius: 16,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
    },
    rootIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFEBE9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rootName: {
        fontWeight: '700',
        color: '#333',
        fontSize: 14
    },
    rootRelation: {
        color: '#888',
        fontSize: 11
    },
    emptyState: {
        marginRight: 10,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        maxWidth: '100%',
        minWidth: 200
    },
    emptyText: {
        color: '#AAA',
        fontStyle: 'italic',
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
        flexWrap: 'wrap',
        minWidth: 150,
        maxWidth: '70%'
    },
    inviteCard: {
        backgroundColor: '#F0F4C3',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end'
    },
    inviteText: {
        color: '#558B2F',
        fontWeight: 'bold',
        fontSize: 13
    }
});
