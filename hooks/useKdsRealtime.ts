"use client"

import { useEffect, useRef } from "react"

type KdsMessage = unknown

interface UseKdsRealtimeOptions {
  url?: string
  companyId: number
  onMessage?: (data: KdsMessage) => void
}

export function useKdsRealtime({ url = process.env.NEXT_PUBLIC_KDS_WS_URL ?? "ws://179.127.4.150:8100", companyId, onMessage }: UseKdsRealtimeOptions) {
  const wsRef = useRef<WebSocket | null>(null)
  const retryRef = useRef<number>(0)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onMessageRef = useRef(onMessage)

  // Atualiza a ref sempre que onMessage mudar, sem recriar a conexão
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    let closedByUser = false

    const connect = () => {
      console.log(`🔌 [KDS WebSocket] Tentando conectar em: ${url} (Company ID: ${companyId})`)
      try {
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
          console.log("🔌 [KDS WebSocket] Conectado com sucesso:", url)
          retryRef.current = 0
          const registerPayload = {
            command: "@REGISTER@",
            id: companyId,
            kind: "socketKds",
          }
          console.log("📤 [KDS WebSocket] Enviando registro:", registerPayload)
          ws.send(JSON.stringify(registerPayload))
          console.log("✅ [KDS WebSocket] Registro enviado com sucesso")
        }

        ws.onmessage = (event) => {
          console.log("📥 [KDS WebSocket] Mensagem recebida:", event.data)
          try {
            const data = JSON.parse(event.data)
            console.log("📦 [KDS WebSocket] Dados parseados:", data)
            onMessageRef.current?.(data)
          } catch (error) {
            console.log("⚠️ [KDS WebSocket] Erro ao parsear mensagem, enviando raw:", error)
            onMessageRef.current?.(event.data as unknown)
          }
        }

        ws.onerror = (error) => {
          console.error("❌ [KDS WebSocket] Erro na conexão:", error)
          // allow close handler to handle reconnection
        }

        ws.onclose = (event) => {
          console.log("🔌 [KDS WebSocket] Conexão fechada. Code:", event.code, "Reason:", event.reason, "WasClean:", event.wasClean)
          wsRef.current = null
          if (closedByUser) {
            console.log("👋 [KDS WebSocket] Fechado pelo usuário, não reconectando")
            return
          }
          const retry = Math.min(30_000, 1000 * Math.pow(2, retryRef.current++))
          console.log(`🔄 [KDS WebSocket] Tentando reconectar em ${retry}ms (tentativa ${retryRef.current})`)
          reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current)
          reconnectTimerRef.current = setTimeout(connect, retry)
        }
      } catch (error) {
        console.error("❌ [KDS WebSocket] Erro ao criar conexão:", error)
        // schedule another attempt
        const retry = Math.min(30_000, 1000 * Math.pow(2, retryRef.current++))
        console.log(`🔄 [KDS WebSocket] Tentando reconectar em ${retry}ms (tentativa ${retryRef.current})`)
        reconnectTimerRef.current && clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = setTimeout(connect, retry)
      }
    }

    console.log(`🚀 [KDS WebSocket] Inicializando conexão WebSocket (URL: ${url}, Company ID: ${companyId})`)
    connect()

    return () => {
      console.log("🧹 [KDS WebSocket] Limpando conexão WebSocket")
      closedByUser = true
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        console.log("🛑 [KDS WebSocket] Timer de reconexão cancelado")
      }
      if (wsRef.current) {
        wsRef.current.close()
        console.log("🔌 [KDS WebSocket] Conexão fechada")
      }
    }
  }, [url, companyId]) // Removido onMessage das dependências para evitar loop infinito
}


