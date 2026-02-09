import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export type ItemStatus = 
    | "preparoAguardandoProducao"
    | "preparoEmProducao"
    | "preparoCancelado"
    | "preparoPausado"
    | "preparoFinalizado";

export type TempoPreparoStatus =
  | "tempoPreparoAtencao"
  | "tempoEmAtraso"
  | "tempoPreparoIndefinido"
  | "tempoPreparoOk";

export interface Adicionais {
  preparoItemAdicionalId: number;
  preparoItemId: number;
  categoriaAdicionalId: number;
  produtoId: number | null;
  nome: string;
  qtde: number;
}

export interface ItemPreparo {
  preparoProducaoId: number;
  preparoItemId: number;
  produtoId: number;
  keyId: number;
  chaveId: string;
  fichaTecnicaId: number;
  complemento: string | null;
  observacao: string | null;
  qtde: number;
  numeroItem: number;
  status: ItemStatus; // Usa o tipo definido acima
  nome: string;
  adicionais: Adicionais[]; // Tipar melhor se souber a estrutura
}

export interface PreparoProducao {
  preparoProducaoId: number;
  empresaId: number;
  pdvId: number;
  terminalId: number;
  keyId: number;
  status: ItemStatus; // Usa o tipo definido acima
  numero: string;
  clienteNome: string;
  origem: string;
  observacao: string | null;
  dataHoraStatus: string | null; // String ISO 8601 ou null
  garcomId: number | null;
  createdAt: string;
  updatedAt: string;
  tempoPreparo: number;
  pdv: string;
  terminal: string;
  comandaId: number | null;
  comandaNumero: number | null;
  mesaId: number | null;
  mesaNumero: number | null;
  contaId: number | null;
  contaNumero: number | null;
  exibirNumeroCartaoConta: boolean;
  garcom: string | null;
  items: ItemPreparo[]; // Array de itens
  tempoPreparoStatus: TempoPreparoStatus;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface OrdersResponse {
  data: PreparoProducao[];
  pagination: PaginationInfo;
}

export function useLoadOrdersByTerminal(
  terminal: string,
  companyId: number | undefined,
  dataInicial?: string,
  dataFinal?: string,
  page: number = 1,
  limit: number = 20,
  status?: string,
) {
  return useQuery<OrdersResponse>({
    queryKey: ['load-orders-by-terminal', terminal, dataInicial, dataFinal, page, limit, status],
    queryFn: async () => {
      if (!terminal || !companyId) throw new Error("Terminal é obrigatório");

      // Função auxiliar para converter YYYY-MM-DD -> DD/MM/YYYY
      const formatDateToBR = (date: string) => {
        const [y, m, d] = date.split("-");
        return `${d}/${m}/${y}`;
      };

      const params = new URLSearchParams();

      // ✅ Corrigido: backend espera terminalId, não terminal_id
      if (terminal !== 'all') params.append('terminalId', terminal);

      // ✅ Adiciona página e limite
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      // Filtra por status quando não for "all" nem o filtro especial "atrasado"
      if (status && status !== 'all' && status !== 'atrasado' && status !== 'preparoEmAtraso') {
        params.append('where', `status='${status}'`);
      }

      if (status && status === 'preparoEmAtraso') {
        params.append('where', `tempo_preparo_status='tempoEmAtraso'`);
      }

      // ✅ Corrigido: converte datas para formato dd/MM/yyyy
      if (dataInicial) params.append('dataInicial', formatDateToBR(dataInicial));
      if (dataFinal) params.append('dataFinal', formatDateToBR(dataFinal));

      const queryString = params.toString() ? `?${params.toString()}` : '';

      console.log("🔍 Query string gerada:", queryString);

      const response = await api.get(`/shared/kds/${companyId}/preparos/${queryString}`);
      
      // Extrai informações de paginação dos headers
      const totalItems = parseInt(response.headers['x-total-count'] || '0');
      const itemsPerPage = parseInt(response.headers['x-per-page'] || limit.toString());
      const totalPages = Math.ceil(totalItems / itemsPerPage);

      return {
        data: response.data,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage
        }
      };
    },
    // Remove placeholderData para evitar mostrar dados antigos quando o filtro muda
    // Quando o status muda, a queryKey muda e o React Query trata como nova query
    // Sem placeholderData, não mantemos dados de outros status durante o carregamento
    staleTime: 5_000,
    enabled: !!terminal && !!companyId,
  });
}
