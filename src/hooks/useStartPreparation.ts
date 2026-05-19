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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-count'] })
      queryClient.invalidateQueries({ queryKey: ['load-orders-by-terminal'] })
    }
  })
}