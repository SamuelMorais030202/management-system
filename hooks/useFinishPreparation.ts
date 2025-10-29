import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useFinishPreparation(companyId: number, id: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      if (!companyId || !id) throw new Error("Empresa e id são abrigatórios")

      const { data } = await api.post(`/shared/kds/${companyId}/preparos/${id}/finalizar`)
      return data;
    },
    onSuccess: () => {
      // Invalida apenas as queries de contagem, não as de pedidos paginados
      queryClient.invalidateQueries({ queryKey: ['order-count'] })
      
      // Atualiza o cache das queries de pedidos sem refetch
      queryClient.setQueriesData(
        { queryKey: ['load-orders-by-terminal'] },
        (oldData: any) => {
          if (!oldData?.data) return oldData
          
          return {
            ...oldData,
            data: oldData.data.map((order: any) => 
              order.preparoProducaoId === id 
                ? { ...order, status: 'preparoFinalizado' }
                : order
            )
          }
        }
      )
    }
  })
}