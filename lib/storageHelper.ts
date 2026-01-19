import { supabase } from './supabase';
// CAMBIO CLAVE: Importamos desde 'legacy' para evitar el error de deprecación
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import * as ImageManipulator from 'expo-image-manipulator';

// Función helper para obtener el formato correcto
const getImageFormat = () => {
    try {
        if (ImageManipulator && ImageManipulator.SaveFormat) {
            return ImageManipulator.SaveFormat.JPEG;
        }
    } catch (e) {
        // Fallback
    }
    return 'jpeg' as any;
};

/**
 * Detecta si un URI es un vídeo basándose en la extensión o el tipo MIME
 */
const isVideoFile = (uri: string): boolean => {
    const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
    const lowerUri = uri.toLowerCase();
    return videoExtensions.some(ext => lowerUri.includes(ext)) || lowerUri.includes('video');
};

export const uploadMedia = async (uri: string, userId: string, bucket: string): Promise<string | null> => {
    // Validar que el bucket esté especificado
    if (!bucket || (bucket !== 'avatars' && bucket !== 'memories')) {
        console.error('❌ Error: bucket debe ser "avatars" o "memories". Recibido:', bucket);
        throw new Error(`Bucket inválido: ${bucket}. Debe ser "avatars" o "memories".`);
    }
    try {
        // Detectar si es video (los vídeos ya vienen comprimidos del picker nativo)
        const isVideo = isVideoFile(uri);

        if (isVideo) {
            // Para videos: subir directamente sin compresión adicional
            // El vídeo ya viene comprimido por el sistema operativo gracias a videoQuality y videoExportPreset
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64' as any,
            });
            const fileData = decode(base64);

            // Detectar extensión del archivo
            const fileExt = uri.split('.').pop()?.toLowerCase() || 'mp4';
            const fileName = `${userId}/${Date.now()}.${fileExt}`;

            // Determinar content type
            const contentType = fileExt === 'mov' ? 'video/quicktime' :
                fileExt === 'm4v' ? 'video/x-m4v' :
                    'video/mp4';

            const { data, error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, fileData, {
                    contentType: contentType,
                    upsert: true
                });

            if (uploadError) {
                console.error('Supabase Upload Error (video):', uploadError);
                throw uploadError;
            }

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            console.log('🎥 Video Public URL:', urlData.publicUrl);
            return urlData.publicUrl;
        }

        // Para imágenes: comprimir y redimensionar
        const manipulatedImage = await ImageManipulator.manipulateAsync(
            uri,
            [
                { resize: { width: 1080 } }, // Redimensionar a máximo 1080px de ancho
            ],
            {
                compress: 0.7, // Comprimir calidad al 70%
                format: getImageFormat(),
            }
        );

        // Leer el archivo comprimido como Base64 usando la API Legacy
        const base64 = await FileSystem.readAsStringAsync(manipulatedImage.uri, {
            encoding: 'base64' as any,
        });

        // Convertir Base64 a ArrayBuffer
        const fileData = decode(base64);

        // Generar nombre y ruta
        const fileExt = 'jpg'; // Siempre JPEG después de la manipulación
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        // Subir a Supabase
        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileData, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase Upload Error (image):', uploadError);
            throw uploadError;
        }

        // Obtener la URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        console.log('📸 Image Public URL:', urlData.publicUrl);
        return urlData.publicUrl;

    } catch (error) {
        console.error('Error general subiendo media:', error);
        return null;
    }
};

// Nueva función para subir múltiples archivos
export const uploadMultipleMedia = async (
    uris: string[],
    userId: string,
    bucket: string // OBLIGATORIO: debe ser 'avatars' o 'memories'
): Promise<string[]> => {
    // Validar que el bucket esté especificado
    if (!bucket || (bucket !== 'avatars' && bucket !== 'memories')) {
        console.error('❌ Error: bucket debe ser "avatars" o "memories". Recibido:', bucket);
        throw new Error(`Bucket inválido: ${bucket}. Debe ser "avatars" o "memories".`);
    }
    const uploadPromises = uris.map(uri => uploadMedia(uri, userId, bucket));
    const results = await Promise.all(uploadPromises);
    return results.filter(url => url !== null) as string[];
};
