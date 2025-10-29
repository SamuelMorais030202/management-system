import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export interface Terminals {
  terminalId: number;
  nome: string;
  empresaId: number;
  preparoProducao: boolean;
  tempoPreparo: number;
}

export function useLoadTerminals(companyId: number | null | undefined) {
  return useQuery<Terminals[]>({
    queryKey: ['load-terminal', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error("CompanyId é obrigatório")

      const { data } = await api.get(`/shared/kds/${companyId}/terminais`);
      
      return data;
    },
    enabled: !!companyId, 
  });
}