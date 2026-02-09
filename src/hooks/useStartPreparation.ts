import { api } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface StartPreparationResponse {
  preparoProducaoId: number;
  status: string;
  dataHoraStatus: string;
}

export function useStartPreparation(companyId: number, id: number) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async () => {
      if (!companyId || !id) throw new Error("Empresa e id são abrigatórios")

      const { data } = await api.post<StartPreparationResponse>(
        `/shared/kds/${companyId}/preparos/${id}/iniciar`,
      );
      return data;
    },
    onSuccess: (data) => {
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
                ? { 
                    ...order, 
                    status: 'preparoEmProducao',
                    dataHoraStatus: data.dataHoraStatus
                  }
                : order
            )
          }
        }
      )
    }
  })
}