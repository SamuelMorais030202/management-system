import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface OrderCountResponse {
  empresaId: number,
  status: string;
  count: number;
  createdAt: string;
}

export function useOrderCount(terminal: string, companyId: number | undefined, dataInicial?: string, dataFinal?: string) {
  return useQuery<OrderCountResponse[]>({
    queryKey: ["order-count", terminal, companyId, dataInicial, dataFinal],
    queryFn: async () => {
      if (!terminal || !companyId) throw new Error("Terminal é obrigatório");

      const formatDateToBR = (date: string) => {
        const [y, m, d] = date.split("-");
        return `${d}/${m}/${y}`;
      };

      const params = new URLSearchParams();

      // Adiciona terminalId se não for 'all'
      if (terminal !== 'all') params.append('terminalId', terminal);

      if (dataInicial) params.append('dataInicial', formatDateToBR(dataInicial));
      if (dataFinal) params.append('dataFinal', formatDateToBR(dataFinal));

      const queryString = params.toString() ? `?${params.toString()}` : '';

      const { data } = await api.get(`/shared/kds/${companyId}/preparos/count${queryString}`)
      return data;
    },
    enabled: !!terminal && !!companyId,
  })
}