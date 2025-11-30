import React, { memo, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTreeStore } from '@/stores/treeStore';
import { BranchType, RootType } from '@/types/tree';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { Sprout } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- CONFIGURACIÓN DEL LIENZO (Tu diseño exacto) ---
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 1800;
const CENTER_X = CANVAS_WIDTH / 2;
const BASE_Y = CANVAS_HEIGHT - 200; // Base del tronco

// Paleta de colores del diseño
const DESIGN_THEME = {
    bg: '#F3F0E9',        // Beige suave
    trunk: '#795548',     // Marrón madera
    ground: '#E0E0E0',    // Suelo sutil
    textDark: '#2D3436',
};

// --- COMPONENTES OPTIMIZADOS (Memorizados para rendimiento) ---

// 1. Nodo de Rama (Burbuja)
const BranchBubble = memo(({ branch, x, y, onPress, fruitCount }: { branch: BranchType; x: number; y: number; onPress: (b: BranchType) => void, fruitCount: number }) => (
    <View style={{ position: 'absolute', left: x - 45, top: y - 45, width: 90, height: 90, alignItems: 'center', justifyContent: 'center' }}>
        {/* Badge de contador */}
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
            <Text style={styles.branchText} numberOfLines={2} adjustsFontSizeToFit>
                {branch.name}
            </Text>
        </TouchableOpacity>
    </View>
));

// 2. Tarjeta de Raíz
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

// --- COMPONENTE PRINCIPAL ---

export default function Tree() {
    const { tree, isLoading } = useTreeStore();
    const router = useRouter();

    // Cálculos geométricos (Optimizados con useMemo)
    const { layoutBranches, trunkPath } = useMemo(() => {
        if (!tree) return { layoutBranches: [], trunkPath: '' };

        const branches = tree.branches || [];

        // 1. DIBUJO DEL TRONCO
        const trunkWidth = 35;
        const trunkHeight = 900; // Tronco alto como en tu imagen
        const trunkTopY = BASE_Y - trunkHeight;

        const trunkPath = `
            M ${CENTER_X - trunkWidth / 2} ${BASE_Y}
            L ${CENTER_X - trunkWidth / 2} ${trunkTopY}
            Q ${CENTER_X} ${trunkTopY - 20} ${CENTER_X + trunkWidth / 2} ${trunkTopY}
            L ${CENTER_X + trunkWidth / 2} ${BASE_Y}
            Z
        `;

        // 2. DIBUJO DE RAMAS
        const layoutBranches = branches.map((branch, i) => {
            const isLeft = i % 2 === 0;
            const sideMultiplier = isLeft ? -1 : 1;

            // Distribución vertical
            const verticalSpacing = 140;
            const startY = BASE_Y - 250 - (i * verticalSpacing);

            // Posición final (Donde va la burbuja)
            const branchLength = 220;
            const endX = CENTER_X + (sideMultiplier * branchLength);
            const endY = startY - 60;

            // Curva Bezier
            const startX = CENTER_X;
            const cp1x = CENTER_X + (sideMultiplier * 100); // Curva salida
            const cp1y = startY;
            const cp2x = endX - (sideMultiplier * 50);      // Curva llegada
            const cp2y = endY + 20;

            const path = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

            // Contamos los frutos en tiempo real desde el store
            const fruitCount = tree.fruits.filter(f => f.branchId === branch.id).length;

            return { ...branch, x: endX, y: endY, path, fruitCount };
        });

        return { layoutBranches, trunkPath };
    }, [tree]); // Se recalcula automáticamente si el árbol cambia (ej: al borrar)

    return (
        <View style={styles.container}>
            {isLoading && (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            )}

            <ReactNativeZoomableView
                maxZoom={1.5}
                minZoom={0.4}
                zoomStep={0.5}
                initialZoom={0.65}
                bindToBorders={false}
                style={styles.zoomView}
                contentWidth={CANVAS_WIDTH}
                contentHeight={CANVAS_HEIGHT}
                initialOffsetX={-(CANVAS_WIDTH - SCREEN_WIDTH) / 2}
                initialOffsetY={-(CANVAS_HEIGHT - SCREEN_HEIGHT) + 250}
            >
                <View style={styles.canvas}>
                    <Svg width={CANVAS_WIDTH} height={CANVAS_HEIGHT} style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor="#E0E0E0" stopOpacity="0.5" />
                                <Stop offset="1" stopColor="#F3F0E9" stopOpacity="0" />
                            </LinearGradient>
                        </Defs>

                        {/* Suelo */}
                        <Path
                            d={`M 0 ${BASE_Y} Q ${CENTER_X} ${BASE_Y - 80} ${CANVAS_WIDTH} ${BASE_Y} V ${CANVAS_HEIGHT} H 0 Z`}
                            fill="#E8E6DC"
                        />

                        {/* Tronco */}
                        <Path d={trunkPath} fill={DESIGN_THEME.trunk} />

                        {/* Líneas de Ramas */}
                        {layoutBranches.map((b) => (
                            <Path
                                key={`path-${b.id}`}
                                d={b.path}
                                stroke={DESIGN_THEME.trunk}
                                strokeWidth={12}
                                strokeLinecap="round"
                                fill="none"
                            />
                        ))}
                    </Svg>

                    {/* Nodos Interactivos (Burbujas) */}
                    {layoutBranches.map((b) => (
                        <BranchBubble
                            key={b.id}
                            branch={b}
                            x={b.x}
                            y={b.y}
                            fruitCount={b.fruitCount}
                            onPress={(branch) => router.push({ pathname: '/branch-details', params: { id: branch.id } })}
                        />
                    ))}
                </View>
            </ReactNativeZoomableView>

            {/* PANEL INFERIOR: Raíces Familiares */}
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
                                onPress={(r) => router.push({ pathname: '/root-details', params: { id: r.id } })}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Añade a tus padres para empezar.</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.inviteCard}
                        onPress={() => router.push('/share-tree')}
                    >
                        <Text style={styles.inviteText}>+ Invitar</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: DESIGN_THEME.bg
    },
    zoomView: { width: '100%', height: '100%' },
    canvas: { width: CANVAS_WIDTH, height: CANVAS_HEIGHT },
    loaderContainer: {
        position: 'absolute', top: 100, left: 0, right: 0, zIndex: 100, alignItems: 'center',
    },

    // Estilos Burbuja
    branchCircle: {
        width: 90, height: 90,
        borderRadius: 45,
        justifyContent: 'center', alignItems: 'center',
        elevation: 5,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
    },
    branchText: {
        color: '#FFF', fontWeight: 'bold', fontSize: 14, textAlign: 'center', paddingHorizontal: 5,
    },
    badge: {
        position: 'absolute', top: 0, right: 0,
        backgroundColor: '#F5F5F5',
        width: 28, height: 28, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center',
        zIndex: 10, elevation: 6,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
    },
    badgeText: { color: '#333', fontWeight: 'bold', fontSize: 12 },

    // Panel Inferior
    bottomPanel: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        paddingVertical: 20, paddingHorizontal: 20,
        elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: -5 }, shadowOpacity: 0.08, shadowRadius: 10,
        height: 170,
    },
    panelTitle: {
        fontSize: 18, fontWeight: 'bold', color: DESIGN_THEME.textDark, marginBottom: 12
    },
    rootsList: { alignItems: 'center', paddingRight: 20 },
    rootCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF',
        padding: 10, paddingRight: 16, borderRadius: 16,
        marginRight: 12, borderWidth: 1, borderColor: '#F0F0F0',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
    },
    rootIconContainer: {
        width: 36, height: 36, borderRadius: 18, backgroundColor: '#EFEBE9',
        justifyContent: 'center', alignItems: 'center', marginRight: 10,
    },
    rootName: { fontWeight: '700', color: '#333', fontSize: 14 },
    rootRelation: { color: '#888', fontSize: 11 },
    emptyState: { marginRight: 10 },
    emptyText: { color: '#AAA', fontStyle: 'italic' },
    inviteCard: {
        backgroundColor: '#F0F4C3', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 16,
        justifyContent: 'center', alignItems: 'center',
    },
    inviteText: { color: '#558B2F', fontWeight: 'bold', fontSize: 13 },
});