import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

/**
 * Helper para obtener el formato JPEG correcto según la versión de expo-image-manipulator
 */
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
 * Detecta si un URI es un video basándose en la extensión o el tipo MIME
 */
export const isVideoFile = (uri: string): boolean => {
  const videoExtensions = ['.mp4', '.mov', '.m4v', '.avi', '.mkv', '.webm'];
  const lowerUri = uri.toLowerCase();
  return videoExtensions.some(ext => lowerUri.includes(ext)) || lowerUri.includes('video');
};

/**
 * Valida la duración de un video (máximo 15 segundos)
 * @param duration - Duración en milisegundos
 * @returns true si es válido, false si excede el límite
 */
export const validateVideoDuration = (duration: number): boolean => {
  const MAX_DURATION_MS = 15000; // 15 segundos
  return duration <= MAX_DURATION_MS;
};

/**
 * Optimiza una imagen según su tipo de uso
 * @param uri - URI local de la imagen (file:// o content://)
 * @param type - Tipo de imagen: 'profile' o 'memory'
 * @returns URI de la imagen optimizada
 */
export const optimizeImage = async (
  uri: string,
  type: 'profile' | 'memory'
): Promise<string> => {
  try {
    const format = getImageFormat();

    if (type === 'profile') {
      // Imágenes de perfil: 300x300px cuadradas, compresión 0.5
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 300, height: 300 } }, // Cuadradas 300x300
        ],
        {
          compress: 0.5,
          format: format,
        }
      );
      return manipulated.uri;
    } else {
      // Imágenes de recuerdos: máximo 1080px (ancho o alto), compresión 0.6
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          { resize: { width: 1080 } }, // Redimensiona manteniendo aspecto, máximo 1080px
        ],
        {
          compress: 0.6,
          format: format,
        }
      );
      return manipulated.uri;
    }
  } catch (error: any) {
    console.error('Error optimizando imagen:', error);
    // Si falla la optimización, devolver la URI original como fallback
    Alert.alert(
      'Advertencia',
      'No se pudo optimizar la imagen, se subirá sin optimizar.'
    );
    return uri;
  }
};

/**
 * Procesa y valida un asset del ImagePicker
 * - Valida duración de videos (máximo 15 segundos)
 * - Optimiza imágenes según el tipo
 * @param asset - Asset del ImagePicker
 * @param imageType - Tipo de imagen ('profile' o 'memory') - solo aplica para imágenes
 * @returns URI optimizada o null si el video excede el límite
 */
export const processMediaAsset = async (
  asset: {
    uri: string;
    type?: string;
    duration?: number;
  },
  imageType: 'profile' | 'memory' = 'memory'
): Promise<string | null> => {
  const isVideo = asset.type?.includes('video') || isVideoFile(asset.uri);

  if (isVideo) {
    // Validar duración del video
    if (asset.duration !== undefined && asset.duration > 0) {
      // asset.duration puede venir en segundos o milisegundos dependiendo de la plataforma
      // Normalizamos a milisegundos: si es menor a 1000, asumimos que está en segundos
      const durationMs = asset.duration < 1000 ? asset.duration * 1000 : asset.duration;

      if (!validateVideoDuration(durationMs)) {
        Alert.alert(
          'Video excedido',
          'El video dura más de 15 segundos. Por favor, recórtalo o elige otro.',
          [{ text: 'Entendido' }]
        );
        return null;
      }
    }
    // Para videos, devolver URI original (ya se optimiza con videoQuality en el picker)
    return asset.uri;
  } else {
    // Para imágenes, optimizar
    return await optimizeImage(asset.uri, imageType);
  }
};

