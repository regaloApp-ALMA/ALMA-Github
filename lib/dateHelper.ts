/**
 * Formatea una fecha relativa al tiempo actual
 * @param dateString - Fecha en formato ISO string o Date
 * @returns String formateado como "Hace X minutos/horas/días" o "Recientemente"/"Hace un momento"
 */
export const formatRelativeTime = (dateString: string | Date): string => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    // Caso especial: menos de 2 minutos -> "Recientemente" o "Hace un momento"
    if (diffMinutes < 2) {
      return 'Recientemente';
    }

    // Menos de 1 hora: "Hace X minutos"
    if (diffMinutes < 60) {
      return `Hace ${diffMinutes} ${diffMinutes === 1 ? 'minuto' : 'minutos'}`;
    }

    // Menos de 24 horas: "Hace X horas"
    if (diffHours < 24) {
      return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    }

    // Días: "Hace X días"
    if (diffDays < 30) {
      return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
    }

    // Más de 30 días: Formato de fecha completo
    const months = diffDays / 30;
    if (months < 12) {
      const roundedMonths = Math.floor(months);
      return `Hace ${roundedMonths} ${roundedMonths === 1 ? 'mes' : 'meses'}`;
    }

    const years = Math.floor(months / 12);
    return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
  } catch (error) {
    console.error('Error formateando fecha relativa:', error);
    return 'Recientemente';
  }
};

