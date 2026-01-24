import { supabase } from './supabase';
import { Alert } from 'react-native';

/**
 * Sube un archivo local a Supabase Storage y devuelve la URL pública.
 * Implementa el patrón Fetch-to-Blob necesario para React Native / Expo.
 */
export const uploadMedia = async (uri: string, bucket: string = 'memories'): Promise<string | null> => {
    try {
        // 1. Validación básica
        if (!uri) return null;

        // 2. Generar nombre único y ruta
        const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const path = `${fileName}`;

        // 3. CONVERSIÓN CRÍTICA (Magic Fix) 🪄
        // En Expo, debemos hacer un fetch a la URI local para obtener el Blob
        const response = await fetch(uri);
        const blob = await response.blob();

        // 4. Subida a Supabase
        // Upsert false para evitar sobreescribir (aunque el nombre es único)
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, blob, {
                contentType: blob.type || 'image/jpeg', // Asegurar tipo MIME adecuado
                upsert: false,
            });

        if (error) {
            console.error("❌ Error Supabase Upload:", error.message);
            throw error;
        }

        // 5. Obtener URL Pública
        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        console.log("✅ Subida exitosa:", publicData.publicUrl);
        return publicData.publicUrl;

    } catch (error: any) {
        console.error("❌ Error en uploadMedia:", error);
        Alert.alert("Error de Subida", "No se pudo subir la imagen. Verifica tu conexión.");
        return null;
    }
};

/**
 * Procesa un lote de imágenes (mezcla de nuevas y viejas)
 * Devuelve un array con TODAS las URLs finales (remotas y recién subidas).
 */
export const processMediaBatch = async (mediaList: any[], bucket: string = 'memories'): Promise<string[]> => {
    const finalUrls: string[] = [];

    for (const item of mediaList) {
        // A) Si ya es una URL remota, la guardamos
        if (typeof item === 'string' && item.startsWith('http')) {
            finalUrls.push(item);
            continue;
        }

        // B) Si es local, intentamos subirla
        // Manejamos si viene como string directo o objeto { uri: ... }
        const uriToUpload = typeof item === 'object' && item.uri ? item.uri : item;

        if (typeof uriToUpload === 'string' && uriToUpload) {
            const publicUrl = await uploadMedia(uriToUpload, bucket);
            if (publicUrl) finalUrls.push(publicUrl);
        }
    }
    return finalUrls;
};
