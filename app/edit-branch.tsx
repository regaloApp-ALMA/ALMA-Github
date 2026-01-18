import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useTreeStore } from '@/stores/treeStore';
import colors from '@/constants/colors';
import { useThemeStore } from '@/stores/themeStore';
import { Save, Palette } from 'lucide-react-native';

// Expanded color palette for branch customization
const BRANCH_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DFE6E9', '#74B9FF', '#A29BFE', '#FD79A8', '#FDCB6E',
    '#6C5CE7', '#00B894', '#00CEC9', '#0984E3', '#6C5CE7',
    '#E17055', '#FF7675', '#FD79A8', '#FDCB6E', '#55EFC4',
    '#81ECEC', '#74B9FF', '#A29BFE', '#DFE6E9', '#B2BEC3'
];

export default function EditBranchScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { tree, fetchMyTree } = useTreeStore();
    const { theme } = useThemeStore();
    const isDarkMode = theme === 'dark';
    const router = useRouter();

    const [name, setName] = useState('');
    const [selectedColor, setSelectedColor] = useState(colors.primary);
    const [side, setSide] = useState<'left' | 'right'>('left');
    const [verticalOffset, setVerticalOffset] = useState(120);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!tree) {
            fetchMyTree();
        } else if (id) {
            const branch = tree.branches.find(b => b.id === id);
            if (branch) {
                setName(branch.name);
                setSelectedColor(branch.color || colors.primary);

                // Parse existing position if available
                if (branch.position && typeof branch.position === 'object') {
                    if ('side' in branch.position) {
                        setSide((branch.position as any).side || 'left');
                    }
                    if ('verticalOffset' in branch.position) {
                        setVerticalOffset((branch.position as any).verticalOffset || 120);
                    }
                }
                setIsLoading(false);
            } else {
                Alert.alert('Error', 'Rama no encontrada');
                router.back();
            }
        }
    }, [tree, id]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Error', 'El nombre de la rama no puede estar vacío');
            return;
        }

        if (!id) {
            Alert.alert('Error', 'ID de rama no encontrado');
            return;
        }

        setIsSaving(true);
        try {
            // Use the new updateBranch function
            const { updateBranch } = useTreeStore.getState();
            await updateBranch(id, {
                name: name.trim(),
                color: selectedColor,
                position: { side, verticalOffset }
            });

            Alert.alert(
                '✅ Rama actualizada',
                'Los cambios han sido guardados exitosamente.',
                [{
                    text: 'Ver rama',
                    onPress: () => {
                        router.dismissAll();
                        router.push({ pathname: '/branch-details', params: { id } });
                    }
                }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'No se pudo actualizar la rama');
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.center, isDarkMode && styles.centerDark]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    title: 'Editar Rama',
                    headerStyle: { backgroundColor: isDarkMode ? '#1E1E1E' : colors.primary },
                    headerTintColor: '#FFF',
                }}
            />

            <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
                <View style={styles.group}>
                    <Text style={[styles.label, isDarkMode && styles.textWhite]}>Nombre de la rama</Text>
                    <TextInput
                        style={[styles.input, isDarkMode && styles.inputDark]}
                        value={name}
                        onChangeText={setName}
                        placeholder="Nombre de la rama"
                        placeholderTextColor={isDarkMode ? '#666' : colors.gray}
                    />
                </View>

                <View style={styles.group}>
                    <View style={styles.labelRow}>
                        <Palette size={20} color={isDarkMode ? '#FFF' : colors.text} />
                        <Text style={[styles.label, { marginLeft: 8 }, isDarkMode && styles.textWhite]}>
                            Color de la rama
                        </Text>
                    </View>
                    <View style={styles.colorGrid}>
                        {BRANCH_COLORS.map((color, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.colorItem,
                                    { backgroundColor: color },
                                    selectedColor === color && styles.colorItemSelected
                                ]}
                                onPress={() => setSelectedColor(color)}
                            >
                                {selectedColor === color && (
                                    <View style={styles.colorCheck} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.group}>
                    <Text style={[styles.label, isDarkMode && styles.textWhite]}>Posición en el árbol</Text>

                    <Text style={[styles.sublabel, isDarkMode && styles.textLight]}>Lado del tronco</Text>
                    <View style={styles.sideSelector}>
                        <TouchableOpacity
                            style={[
                                styles.sideButton,
                                side === 'left' && styles.sideButtonActive,
                                { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }
                            ]}
                            onPress={() => setSide('left')}
                        >
                            <Text style={[styles.sideButtonText, side === 'left' && styles.sideButtonTextActive]}>
                                ← Izquierda
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.sideButton,
                                side === 'right' && styles.sideButtonActive,
                                { borderTopRightRadius: 12, borderBottomRightRadius: 12 }
                            ]}
                            onPress={() => setSide('right')}
                        >
                            <Text style={[styles.sideButtonText, side === 'right' && styles.sideButtonTextActive]}>
                                Derecha →
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.sublabel, { marginTop: 20 }, isDarkMode && styles.textLight]}>
                        Altura: {verticalOffset}px
                    </Text>
                    <View style={styles.sliderHint}>
                        <Text style={styles.sliderLabel}>Arriba</Text>
                        <Text style={styles.sliderLabel}>Abajo</Text>
                    </View>
                    <View style={styles.sliderContainer}>
                        {[0, 120, 240, 360, 480].map((value) => (
                            <TouchableOpacity
                                key={value}
                                style={[
                                    styles.sliderButton,
                                    verticalOffset === value && styles.sliderButtonActive
                                ]}
                                onPress={() => setVerticalOffset(value)}
                            >
                                <Text style={[
                                    styles.sliderButtonText,
                                    verticalOffset === value && styles.sliderButtonTextActive
                                ]}>
                                    {value}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.disabled]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <>
                            <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveText}>Guardar Cambios</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
    containerDark: { backgroundColor: '#121212' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    centerDark: { backgroundColor: '#121212' },
    group: { marginBottom: 30 },
    label: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: colors.text },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sublabel: { fontSize: 14, color: colors.textLight, marginBottom: 8, fontWeight: '600' },
    textWhite: { color: '#FFF' },
    textLight: { color: '#AAA' },
    input: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
    inputDark: { backgroundColor: '#2C2C2C', borderColor: '#444', color: '#FFF' },
    colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    colorItem: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    colorItemSelected: { borderColor: '#FFF', borderWidth: 3, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
    colorCheck: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
    sideSelector: { flexDirection: 'row', marginTop: 8 },
    sideButton: { flex: 1, paddingVertical: 14, paddingHorizontal: 20, backgroundColor: '#E0E0E0', alignItems: 'center', borderWidth: 1, borderColor: '#CCC' },
    sideButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sideButtonText: { fontSize: 15, fontWeight: '600', color: colors.text },
    sideButtonTextActive: { color: '#FFF' },
    sliderHint: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    sliderLabel: { fontSize: 12, color: colors.textLight },
    sliderContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    sliderButton: { flex: 1, paddingVertical: 10, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center' },
    sliderButtonActive: { backgroundColor: colors.primary },
    sliderButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
    sliderButtonTextActive: { color: '#FFF' },
    saveButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 12,
        marginBottom: 40,
        marginTop: 10
    },
    disabled: { opacity: 0.7 },
    saveText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
