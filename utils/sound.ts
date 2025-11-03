/**
 * Utilitário para tocar sons discretos na aplicação
 */

// Contexto de áudio reutilizável
let audioContext: AudioContext | null = null

/**
 * Obtém ou cria um contexto de áudio
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  
  if (!audioContext) {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return null
      
      audioContext = new AudioContextClass()
    } catch (error) {
      console.warn('Não foi possível criar contexto de áudio:', error)
      return null
    }
  }
  
  // Resume o contexto se estiver suspenso (política de autoplay)
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch((error) => {
      console.warn('Não foi possível resumir contexto de áudio:', error)
    })
  }
  
  return audioContext
}

/**
 * Toca um som de notificação leve e discreto
 * @param type - Tipo de som: 'new-order', 'alert', 'success'
 */
export async function playNotificationSound(type: 'new-order' | 'alert' | 'success' = 'new-order') {
  const ctx = getAudioContext()
  if (!ctx) {
    console.warn('Contexto de áudio não disponível')
    return
  }

  try {
    // Aguarda o contexto estar pronto (caso esteja suspenso)
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Configurações baseadas no tipo
    switch (type) {
      case 'new-order':
        // Beep suave e breve para novo pedido
        oscillator.frequency.value = 800 // Frequência suave
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime) // Volume baixo (20%)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.2) // 200ms - bem breve
        break
      
      case 'alert':
        // Tom mais agudo para alertas
        oscillator.frequency.value = 1000
        oscillator.type = 'sine'
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.25)
        break
      
      case 'success':
        // Tom ascendente para sucesso
        oscillator.frequency.value = 600
        oscillator.type = 'sine'
        oscillator.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.15)
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + 0.15)
        break
    }
  } catch (error) {
    // Log mais detalhado para debug
    console.warn('Erro ao reproduzir som de notificação:', error)
  }
}

/**
 * Inicializa o contexto de áudio com interação do usuário
 * Deve ser chamado após uma interação do usuário (clique, tecla, etc)
 */
export function initAudioContext() {
  if (typeof window === 'undefined') return
  
  // Tenta criar o contexto se ainda não existe
  if (!audioContext) {
    const ctx = getAudioContext()
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch((error) => {
        console.warn('Erro ao inicializar contexto de áudio:', error)
      })
    }
  }
}

