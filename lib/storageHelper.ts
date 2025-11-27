import { supabase } from './supabase';
// CAMBIO CLAVE: Importamos desde 'legacy' para evitar el error de deprecación
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export const uploadMedia = async (uri: string, userId: string, bucket: string = 'avatars') => {
    try {
        // 1. Leer el archivo como Base64 usando la API Legacy (que es estable)
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // 2. Convertir Base64 a ArrayBuffer
        const fileData = decode(base64);

        // 3. Generar nombre y ruta
        const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        // 4. Subir a Supabase
        const { data, error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, fileData, {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            throw uploadError;
        }

        // 5. Obtener la URL pública
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(fileName);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Error general subiendo imagen:', error);
        return null;
    }
};