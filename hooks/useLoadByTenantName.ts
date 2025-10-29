import { api } from "@/lib/api"
import { useQuery, UseQueryResult } from "@tanstack/react-query"

export interface LoadByTenantNameResponse {
  empresaId: number
}

// ⚠️ AJUSTE 1: O tipo de retorno do useQuery deve incluir 'null'
// para cobrir o caso de parsing/erro.
export function useLoadByTenantName(tenantName: string): UseQueryResult<LoadByTenantNameResponse | null> {
  return useQuery<LoadByTenantNameResponse | null>({ // <--- Incluído '| null'
    queryKey: ['tenant', tenantName],
    queryFn: async () => {
      if (!tenantName) return null; // Retorna null em vez de throw (se o enabled estiver ativo)
      
      const { data } = await api.get(`/shared/tenant/${tenantName}`)
      if (typeof data === 'string') {
        try {
          const jsonString = data.replace(/(\w+):/g, '"$1":');
          
          return JSON.parse(jsonString) as LoadByTenantNameResponse; 
        } catch (e) {
          console.error("Erro ao fazer parse do JSON do tenant:", data, e);
          
          return { empresaId: 0 } as LoadByTenantNameResponse; 
        }
      }

      return data as LoadByTenantNameResponse;
    },
    enabled: !!tenantName
  })
}