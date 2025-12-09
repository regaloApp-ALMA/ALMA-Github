import React, { memo, useMemo, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator, Share } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { useTreeStore } from '@/stores/treeStore';
import { BranchType, RootType, TreeType } from '@/types/tree';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Sprout } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ════════════════════════════════════════════════════════════════════════════════
// 🎨 CONFIGURACIÓN DE DISEÑO
// ════════════════════════════════════════════════════════════════════════════════

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
 * @param centerX - Centro horizontal del tronco
 * @param baseY - Y de la base del tronco
 * @param topY - Y del punto más alto del tronco (DINÁMICO)
 */
const generateDynamicTrunkPath = (centerX: number, baseY: number, topY: number): string => {
    const baseWidth = 44;
    const topWidth = 16;
    const trunkHeight = baseY - topY;
    
    // Puntos de control para curvas suaves
    const midY = baseY - trunkHeight * 0.5;
    
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

/**
 * Calcula posición automática para ramas sin coordenadas
 */
const calculateAutoPosition = (index: number, totalBranches: number): { x: number; y: number } => {
    const isLeft = index % 2 === 0;
    const sideMultiplier = isLeft ? -1 : 1;
    
    // Distribución vertical en abanico
    const verticalSpacing = 150;
    const branchLength = 200 + (index % 3) * 30; // Variación orgánica
    
    return {
        x: sideMultiplier * branchLength,
        y: -(250 + index * verticalSpacing) // Negativo = hacia arriba
    };
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
    branch: BranchType; 
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
        justifyContent: 'center' 
    }}>
        {fruitCount > 0 && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{fruitCount}</Text>
            </View>
        )}
        
        <TouchableOpacity
            style={[styles.branchCircle, { backgroundColor: branch.color || colors.primary }]}
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
    treeData?: TreeType | null; // Prop opcional para árbol compartido
    isShared?: boolean; // Indica si es un árbol compartido (solo lectura)
};

export default function Tree({ treeData, isShared = false }: TreeProps = {}) {
    const { tree: storeTree, isLoading, fetchMyTree } = useTreeStore();
    const router = useRouter();

    // Usar el árbol pasado como prop o el del store
    const tree = treeData || storeTree;

    // 🔄 Cargar árbol al montar (solo si no es compartido)
    useEffect(() => {
        if (!isShared && !treeData) {
            fetchMyTree();
        }
    }, []);

    // 🔄 Recargar cuando vuelve a la pantalla (solo si no es compartido)
    useEffect(() => {
        if (isShared || treeData) return; // No recargar si es compartido
        
        // @ts-ignore - addListener existe en tiempo de ejecución
        const unsubscribe = router.addListener?.('focus', () => {
            fetchMyTree(true);
        });
        return () => { if (unsubscribe) unsubscribe(); };
    }, [isShared, treeData]);

    // 🧮 CÁLCULO DINÁMICO DEL ÁRBOL
    const { layoutBranches, trunkPath, foliageCircles, treeTopY } = useMemo(() => {
        if (!tree) return { 
            layoutBranches: [], 
            trunkPath: '', 
            foliageCircles: [], 
            treeTopY: BASE_Y - 400 
        };

        const branches = tree.branches || [];
        
        // ═══════════════════════════════════════════════════════════════════
        // PASO 1: CALCULAR POSICIONES DE RAMAS
        // ═══════════════════════════════════════════════════════════════════
        
        const layoutBranches = branches.map((branch, i) => {
            // Parsear posición si es string
            let branchPosition = branch.position || { x: 0, y: 0 };
            if (typeof branchPosition === 'string') {
                try {
                    branchPosition = JSON.parse(branchPosition);
                } catch (e) {
                    branchPosition = { x: 0, y: 0 };
                }
            }

            // Si la posición es {0,0}, calcular automáticamente
            const hasCustomPosition = branchPosition.x !== 0 || branchPosition.y !== 0;
            
            let finalPosition: { x: number; y: number };
            if (hasCustomPosition) {
                finalPosition = branchPosition;
            } else {
                finalPosition = calculateAutoPosition(i, branches.length);
            }

            // Convertir a coordenadas absolutas del canvas
            const endX = CENTER_X + finalPosition.x;
            const endY = BASE_Y + finalPosition.y; // y negativo sube
            
            // Punto de inicio de la rama (en el tronco)
            const startX = CENTER_X;
            const startY = endY + 40; // Un poco más abajo que el destino para curva natural
            
            // Generar path curvo con Bézier
            const path = generateCurvedBranchPath(startX, startY, endX, endY);
            
            // Contar frutos
            const fruitCount = tree.fruits.filter(f => f.branchId === branch.id).length;
            
            return { 
                ...branch, 
                x: endX, 
                y: endY, 
                path, 
                fruitCount,
                startY // Guardamos para calcular el tronco
            };
        });

        // ═══════════════════════════════════════════════════════════════════
        // PASO 2: CALCULAR ALTURA DINÁMICA DEL TRONCO
        // ═══════════════════════════════════════════════════════════════════
        
        let treeTopY = BASE_Y - 500; // Mínimo por defecto
        
        if (layoutBranches.length > 0) {
            // Encontrar la rama MÁS ALTA (Y más pequeño)
            const highestBranchY = Math.min(...layoutBranches.map(b => b.startY));
            
            // El tronco debe llegar 200px más arriba que la rama más alta
            treeTopY = highestBranchY - 200;
        }

        // ═══════════════════════════════════════════════════════════════════
        // PASO 3: GENERAR TRONCO DINÁMICO
        // ═══════════════════════════════════════════════════════════════════
        
        const trunkPath = generateDynamicTrunkPath(CENTER_X, BASE_Y, treeTopY);

        // ═══════════════════════════════════════════════════════════════════
        // PASO 4: GENERAR FOLLAJE SUTIL
        // ═══════════════════════════════════════════════════════════════════
        
        const foliageCircles = layoutBranches.flatMap((branch, i) => {
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

        return { layoutBranches, trunkPath, foliageCircles, treeTopY };
    }, [tree]);

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            <ReactNativeZoomableView
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
                            {/* Degradado para el tronco */}
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

                        {/* Follaje sutil detrás de las ramas */}
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

                        {/* TRONCO DINÁMICO con degradado */}
                        <Path d={trunkPath} fill="url(#trunkGrad)" />

                        {/* RAMAS con curvas Bézier */}
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

                    {/* NODOS INTERACTIVOS (Burbujas) */}
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

            {/* PANEL INFERIOR: Raíces Familiares (solo si no es árbol compartido) */}
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
// 💅 ESTILOS
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

    // 🎯 Estilos de Burbujas
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

    // 📦 Panel Inferior
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
    },
});
