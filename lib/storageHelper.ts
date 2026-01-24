import { supabase } from './supabase';
import { Alert } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Helper para obtener el formato JPEG correcto
 */
const getImageFormat = () => {
    try {
        if (ImageManipulator && ImageManipulator.SaveFormat) {
            return ImageManipulator.SaveFormat.JPEG;
        }
    } catch (e) { }
    return 'jpeg' as any;
};

/**
 * Comprime agresivamente una imagen antes de subirla
 * - Redimensiona a max 1080px de ancho
 * - Calidad 0.6 (60%)
 * - Convierte a JPEG
 */
const compressImage = async (uri: string): Promise<string> => {
    try {
        const manipulated = await ImageManipulator.manipulateAsync(
            uri,
            [{ resize: { width: 1080 } }], // Redimensionar manteniendo aspect ratio
            {
                compress: 0.6, // Compresión agresiva
                format: getImageFormat(),
            }
        );
        return manipulated.uri;
    } catch (error) {
        console.warn('⚠️ Error comprimiendo imagen, se usará original:', error);
        return uri;
    }
};

/**
 * Detecta si un URI es probable que sea un video
 */
const isVideoFile = (uri: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
    const lowerUri = uri.toLowerCase();
    return videoExtensions.some(ext => lowerUri.includes(ext)) || lowerUri.includes('video');
};

/**
 * Sube un archivo local a Supabase Storage y devuelve la URL pública.
 * Implementa Fetch-to-Blob y Compresión Agresiva para imágenes.
 */
export const uploadMedia = async (uri: string, bucket: string = 'memories'): Promise<string | null> => {
    try {
        // 1. Validación básica
        if (!uri) return null;

        // 2. Obtener Usuario Actual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.id) {
            throw new Error("Usuario no autenticado.");
        }

        // 3. OPTIMIZACIÓN (Compresión)
        // Solo comprimimos si NO es video
        let uriToUpload = uri;
        let isVideo = isVideoFile(uri);

        if (!isVideo) {
            console.log('🔄 Comprimiendo imagen antes de subir...');
            uriToUpload = await compressImage(uri);
        } else {
            console.log('🎥 Archivo detectado como video, saltando compresión...');
        }

        // 4. CONVERSIÓN A BLOB (Fetch)
        const response = await fetch(uriToUpload);
        const blob = await response.blob();

        // 5. Detección de Tipo y Extensión
        const mimeType = blob.type;
        let ext = 'bin';

        if (mimeType.includes('video')) {
            // Confirmamos que es video por el MIME del blob
            isVideo = true;
            if (mimeType.includes('mp4')) ext = 'mp4';
            else if (mimeType.includes('quicktime')) ext = 'mov';
            else ext = 'mp4';
        } else if (mimeType.includes('image')) {
            // Si pasamos por compressImage, siempre será JPEG
            ext = 'jpg';
        } else {
            // Fallback
            ext = uriToUpload.split('.').pop()?.toLowerCase() || 'bin';
        }

        // 6. Generar Ruta: USER_ID / TIMESTAMP.EXT
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const path = `${user.id}/${fileName}`;

        // 7. Subida a Supabase
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, blob, {
                contentType: mimeType,
                upsert: false,
            });

        if (error) {
            console.error("❌ Error Supabase Upload:", error.message);
            throw error;
        }

        // 8. Obtener URL Pública
        const { data: publicData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        console.log(`✅ Subida exitosa (${isVideo ? 'Video' : 'Imagen Optimizada'}): ${publicData.publicUrl}`);
        return publicData.publicUrl;

    } catch (error: any) {
        console.error("❌ Error en uploadMedia:", error);
        Alert.alert("Error de Subida", `No se pudo subir el archivo: ${error.message || 'Error desconocido'}`);
        return null;
    }
};

/**
 * Procesa un lote de archivos
 */
export const processMediaBatch = async (mediaList: any[], bucket: string = 'memories'): Promise<string[]> => {
    const finalUrls: string[] = [];

    for (const item of mediaList) {
        // A) URL remota existente
        if (typeof item === 'string' && item.startsWith('http')) {
            finalUrls.push(item);
            continue;
        }

        // B) Archivo local
        const uriToUpload = typeof item === 'object' && item.uri ? item.uri : item;

        if (typeof uriToUpload === 'string' && uriToUpload) {
            const publicUrl = await uploadMedia(uriToUpload, bucket);
            if (publicUrl) finalUrls.push(publicUrl);
        }
    }
    return finalUrls;
};
