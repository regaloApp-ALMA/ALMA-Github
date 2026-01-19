import React, { useState } from 'react';
import { Image, ImageProps, ImageStyle, StyleProp, StyleSheet, View, ViewStyle, ActivityIndicator } from 'react-native';
import { Image as ImageIcon } from 'lucide-react-native';
import colors from '@/constants/colors';

interface SafeImageProps extends Omit<ImageProps, 'source'> {
    source: { uri?: string } | number;
    containerStyle?: StyleProp<ViewStyle>;
    style?: StyleProp<ImageStyle>;
    placeholderColor?: string;
    timeout?: number; // Optional timeout if we implement it, keeping it for compatibility
}

export default function SafeImage({
    source,
    style,
    containerStyle,
    placeholderColor = '#E0E0E0',
    timeout = 5000,
    ...props
}: SafeImageProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const uri = typeof source === 'object' && source !== null && 'uri' in source ? source.uri : null;
    const validSource = typeof source === 'number' || (uri && typeof uri === 'string' && uri.length > 0);

    // Render del error o fallback
    if (error || !validSource) {
        return (
            <View style={[style as StyleProp<ViewStyle>, styles.centered, { backgroundColor: '#f0f0f0', overflow: 'hidden' }]}>
                <ImageIcon size={24} color="#ccc" />
            </View>
        );
    }

    return (
        <View style={[styles.container, containerStyle]}>
            <Image
                {...props}
                source={source as any}
                style={style}
                onLoadStart={() => {
                    setLoading(true);
                    setError(false);
                }}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
            />
            {loading && (
                <View style={[StyleSheet.absoluteFill, styles.centered, { backgroundColor: placeholderColor }]}>
                    <ActivityIndicator color={colors.primary} size="small" />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        position: 'relative',
        // Default size if not provided? Better to let containerStyle handle it or inherit
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
