/**
 * Formata uma data para "há X tempo atrás"
 * @param dateString - Data em formato ISO 8601 ou string de data
 * @returns String formatada como "há X minutos/horas/dias atrás"
 */
export function formatTimeAgo(dateString: string): string {
  if (!dateString) return ""

  try {
    // ⚠️ Ajuste para compensar backend salvando hora local com sufixo Z
    const backendDate = new Date(dateString)
    const localDate = new Date(backendDate.getTime() + backendDate.getTimezoneOffset() * 60000)
    
    const now = new Date()
    const diffMs = now.getTime() - localDate.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) {
      return "há poucos segundos"
    } else if (diffMinutes < 60) {
      return diffMinutes === 1 
        ? "há 1 minuto" 
        : `há ${diffMinutes} minutos`
    } else if (diffHours < 24) {
      return diffHours === 1 
        ? "há 1 hora" 
        : `há ${diffHours} horas`
    } else if (diffDays < 30) {
      return diffDays === 1 
        ? "há 1 dia" 
        : `há ${diffDays} dias`
    } else {
      const diffMonths = Math.floor(diffDays / 30)
      return diffMonths === 1 
        ? "há 1 mês" 
        : `há ${diffMonths} meses`
    }
  } catch (error) {
    console.warn("Erro ao formatar data:", error)
    return ""
  }
}

