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
  status: ItemStatus;
  nome: string;
  adicionais: Adicionais[];
}

export interface PreparoProducao {
  preparoProducaoId: number;
  empresaId: number;
  pdvId: number;
  terminalId: number;
  keyId: number;
  status: ItemStatus;
  numero: string;
  clienteNome: string;
  origem: string;
  observacao: string | null;
  dataHoraStatus: string | null;
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
  items: ItemPreparo[];
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

export interface FetchOrdersParams {
  terminal: string;
  companyId: number;
  dataInicial?: string;
  dataFinal?: string;
  page?: number;
  limit?: number;
  status?: string;
}

const formatDateToBR = (date: string) => {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
};

export async function fetchOrdersByTerminal({
  terminal,
  companyId,
  dataInicial,
  dataFinal,
  page = 1,
  limit = 20,
  status,
}: FetchOrdersParams): Promise<OrdersResponse> {
  if (!terminal || !companyId) throw new Error("Terminal é obrigatório");

  const params = new URLSearchParams();

  if (terminal !== "all") params.append("terminalId", terminal);

  params.append("page", page.toString());
  params.append("limit", limit.toString());

  if (status && status !== "all" && status !== "atrasado" && status !== "preparoEmAtraso") {
    params.append("where", `status='${status}'`);
  }

  if (status === "preparoEmAtraso") {
    params.append("where", `tempo_preparo_status='tempoEmAtraso'`);
  }

  if (dataInicial) params.append("dataInicial", formatDateToBR(dataInicial));
  if (dataFinal) params.append("dataFinal", formatDateToBR(dataFinal));

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const response = await api.get(`/shared/kds/${companyId}/preparos/${queryString}`);

  const totalItems = parseInt(response.headers["x-total-count"] || "0");
  const itemsPerPage = parseInt(response.headers["x-per-page"] || limit.toString());
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage) || 1);

  return {
    data: response.data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage,
    },
  };
}

/** Busca todas as páginas do filtro atual (usado pela pesquisa em texto). */
export async function fetchAllOrdersByTerminal(
  params: Omit<FetchOrdersParams, "page" | "limit"> & { limit?: number }
): Promise<PreparoProducao[]> {
  const limit = params.limit ?? 100;
  const firstPage = await fetchOrdersByTerminal({ ...params, page: 1, limit });
  const allOrders = [...firstPage.data];
  const totalPages = firstPage.pagination.totalPages;

  if (totalPages <= 1) return allOrders;

  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const pageResults = await Promise.all(
    remainingPages.map((page) => fetchOrdersByTerminal({ ...params, page, limit }))
  );

  for (const result of pageResults) {
    allOrders.push(...result.data);
  }

  return allOrders;
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
    queryKey: ["load-orders-by-terminal", terminal, dataInicial, dataFinal, page, limit, status],
    queryFn: async () => {
      if (!companyId) throw new Error("Empresa é obrigatória");
      return fetchOrdersByTerminal({
        terminal,
        companyId,
        dataInicial,
        dataFinal,
        page,
        limit,
        status,
      });
    },
    staleTime: 5_000,
    placeholderData: (previousData) => previousData,
    enabled: !!terminal && !!companyId,
  });
}
