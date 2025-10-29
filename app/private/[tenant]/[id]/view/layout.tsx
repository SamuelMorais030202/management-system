import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { tenant: string; id: string; terminal?: string } }): Promise<Metadata> {
  const { tenant, terminal } = params
  const suffix = terminal && terminal !== 'all' ? `Terminal ${terminal}` : 'Todos os terminais'
  return {
    title: `KDS — ${tenant} (${suffix})`,
  }
}

export default function ViewLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}


