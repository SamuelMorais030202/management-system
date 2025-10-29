import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { tenant: string } }): Promise<Metadata> {
  const tenant = params.tenant
  return {
    title: `Login — ${tenant}`,
  }
}

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement
}


