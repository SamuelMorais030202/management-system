'use client'

import { Button } from "@/components/ui/button";
import { useLoadByTenantName } from "@/hooks/useLoadByTenantName";
import { useLoadTerminals } from "@/hooks/useLoadTerminals"; 
import { getLocationTypeColor } from "@/utils/getLocationTypeColor";
import { redirect, useParams, useRouter } from "next/navigation";

export default function Tenant() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant?.toString();
  const empresaId = params.id?.toString();

  if (!tenant || !empresaId) redirect('/');
  const { data: tenantData, isLoading: isLoadingTenant } = useLoadByTenantName(tenant);
  const { data: terminals, isLoading: isLoadingTerminals } = useLoadTerminals(Number(empresaId))

  if (isLoadingTenant || isLoadingTerminals) {
    return (
      <section>
        <p>Carregando dados da empresa...</p>
      </section>
    )
  }

  const handleTerminalClick = (terminalId: number | 'all') => {
    let path = '';
    
    if (terminalId === 'all') {
      path = `/private/${tenant}/${empresaId}/view/all`; 
    } else {
      // Exemplo de rota: /demo-hotel/kds/123
      path = `/private/${tenant}/${empresaId}/view/${terminalId}`; 
    }
    
    router.push(path);
  };
  
  return (
    <section className="max-w-lg mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-center mb-6">Selecione um terminal de {tenant} ou veja todos</h1>

      <div className="space-y-2 py-4">
        {terminals?.map((terminal) => (
          <Button 
            key={terminal.terminalId}
            variant="outline"
            className="w-full justify-start h-14 p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleTerminalClick(terminal.terminalId)}
          >
            <div
              className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 mr-4 ${getLocationTypeColor(terminal.nome)}`}
            >
              <span className="text-xs font-bold text-white">{terminal.nome.substring(0, 2).toUpperCase()}</span>
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-medium">{terminal.nome}</div>
            </div>
          </Button>
        ))}
          <Button 
            key="ver todos"
            variant="outline"
            className="w-full justify-start h-14 p-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleTerminalClick('all')}
          >
            <div
              className={`h-10 w-10 rounded flex items-center justify-center flex-shrink-0 mr-4 ${getLocationTypeColor("Ver todos")}`}
            >
              <span className="text-xs font-bold text-white">{"Ver todos".substring(0, 2).toUpperCase()}</span>
            </div>
            
            <div className="flex-1 text-left">
              <div className="font-medium">Ver todos</div>
            </div>
          </Button>
      </div>
    </section>
  )
}