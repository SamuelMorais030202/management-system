import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

interface Props {
  children: ReactNode
}

export function ReactQueryProvider({ children }: Props) {
  const [client] = useState(() => new QueryClient())

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

