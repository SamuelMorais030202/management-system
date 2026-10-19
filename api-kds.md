# Mapeamento de Requisições — Management System (KDS)

Documentação das chamadas HTTP e WebSocket feitas pelo frontend.

## Configuração base

| Variável | Descrição | Fallback |
|---|---|---|
| `VITE_BASE_URL` | Base URL da API REST | `https://api.unisystem.ddns.com.br/orion/v1` |
| `VITE_KDS_WS_URL` | URL do WebSocket KDS | `ws://179.127.4.150:8100` |

Cliente HTTP: Axios (`src/lib/api.ts`), timeout de **10s**.

---

## Índice

1. [POST `/shared/login`](#1-login)
2. [GET `/shared/tenant/:tenantName`](#2-buscar-empresa-por-tenant)
3. [GET `/shared/kds/:companyId/terminais`](#3-listar-terminais)
4. [GET `/shared/kds/:companyId/preparos`](#4-listar-preparos-por-terminal)
5. [GET `/shared/kds/:companyId/preparos/count`](#5-contagem-de-preparos-por-status)
6. [POST `/shared/kds/:companyId/preparos/:id/iniciar`](#6-iniciar-preparo)
7. [POST `/shared/kds/:companyId/preparos/:id/pausar`](#7-pausar-preparo)
8. [POST `/shared/kds/:companyId/preparos/:id/finalizar`](#8-finalizar-preparo)
9. [WebSocket KDS](#9-websocket-kds)

---

## Tipagens compartilhadas

Definidas principalmente em `src/hooks/useLoadOrdersByTerminal.ts`.

```ts
type ItemStatus =
  | "preparoAguardandoProducao"
  | "preparoEmProducao"
  | "preparoCancelado"
  | "preparoPausado"
  | "preparoFinalizado";

type TempoPreparoStatus =
  | "tempoPreparoAtencao"
  | "tempoEmAtraso"
  | "tempoPreparoIndefinido"
  | "tempoPreparoOk";

interface Adicionais {
  preparoItemAdicionalId: number;
  preparoItemId: number;
  categoriaAdicionalId: number;
  produtoId: number | null;
  nome: string;
  qtde: number;
}

interface ItemPreparo {
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

interface PreparoProducao {
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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

interface OrdersResponse {
  data: PreparoProducao[];
  pagination: PaginationInfo;
}
```

> **Nota:** A paginação de preparos não vem no body. O frontend monta `PaginationInfo` a partir dos headers `x-total-count` e `x-per-page`.

---

## 1. Login

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/shared/login` |
| **Hook** | `useLogin` (`src/hooks/useLogin.ts`) |
| **Tipo** | Mutation (React Query) |

### Parâmetros (body)

```ts
interface LoginPayload {
  userName: string;
  password: string;
  empresaId?: number;
}
```

### Resposta esperada

```ts
interface OperadorResponse {
  operadorId: number;
  pessoaId: number;
  codigo: number;
  userName: string;
  ativo: boolean;
}
```

### Exemplo

```http
POST /shared/login
Content-Type: application/json

{
  "userName": "operador01",
  "password": "senha",
  "empresaId": 1
}
```

```json
{
  "operadorId": 10,
  "pessoaId": 20,
  "codigo": 1,
  "userName": "operador01",
  "ativo": true
}
```

---

## 2. Buscar empresa por tenant

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/shared/tenant/:tenantName` |
| **Hook** | `useLoadByTenantName` (`src/hooks/useLoadByTenantName.ts`) |
| **Tipo** | Query (React Query) |

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `tenantName` | `string` | sim | Nome do tenant (habilita a query quando preenchido) |

### Resposta esperada

```ts
interface LoadByTenantNameResponse {
  empresaId: number;
}
```

> A API pode retornar um objeto JSON ou uma **string** no formato `{empresaId:123}` (sem aspas nas chaves). O hook normaliza esse caso com parse manual.

### Exemplo

```http
GET /shared/tenant/minha-empresa
```

```json
{
  "empresaId": 42
}
```

---

## 3. Listar terminais

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/shared/kds/:companyId/terminais` |
| **Hook** | `useLoadTerminals` (`src/hooks/useLoadTerminals.ts`) |
| **Tipo** | Query (React Query) |

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `companyId` | `number` | sim | ID da empresa |

### Resposta esperada

```ts
interface Terminals {
  terminalId: number;
  nome: string;
  empresaId: number;
  preparoProducao: boolean;
  tempoPreparo: number;
}

type Response = Terminals[];
```

### Exemplo

```http
GET /shared/kds/42/terminais
```

```json
[
  {
    "terminalId": 1,
    "nome": "Cozinha Quente",
    "empresaId": 42,
    "preparoProducao": true,
    "tempoPreparo": 15
  }
]
```

---

## 4. Listar preparos por terminal

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/shared/kds/:companyId/preparos/` |
| **Hook** | `useLoadOrdersByTerminal` / `fetchOrdersByTerminal` / `fetchAllOrdersByTerminal` (`src/hooks/useLoadOrdersByTerminal.ts`) |
| **Tipo** | Query (React Query) |

Também usado indiretamente por `useSearchOrdersAcrossPages` (busca em todas as páginas com `limit: 100`).

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `companyId` | `number` | sim | ID da empresa |

### Parâmetros (query)

| Nome | Tipo | Obrigatório | Default | Descrição |
|---|---|---|---|---|
| `terminalId` | `string` | não | — | Enviado apenas se `terminal !== "all"` |
| `page` | `number` | não | `1` | Página atual |
| `limit` | `number` | não | `20` (`100` na busca global) | Itens por página |
| `where` | `string` | não | — | Filtro SQL-like (ver regras abaixo) |
| `dataInicial` | `string` | não | — | Data inicial no formato `dd/MM/yyyy` (convertida de `yyyy-MM-dd`) |
| `dataFinal` | `string` | não | — | Data final no formato `dd/MM/yyyy` (convertida de `yyyy-MM-dd`) |

#### Regras do filtro `where`

| Valor de `status` no frontend | Query enviada |
|---|---|
| `all`, `atrasado`, ou vazio | Nenhum `where` |
| `preparoEmAtraso` | `where=tempo_preparo_status='tempoEmAtraso'` |
| Qualquer outro status (`ItemStatus`) | `where=status='{status}'` |

### Tipagem dos parâmetros no frontend

```ts
interface FetchOrdersParams {
  terminal: string;
  companyId: number;
  dataInicial?: string; // yyyy-MM-dd
  dataFinal?: string;   // yyyy-MM-dd
  page?: number;
  limit?: number;
  status?: string;
}
```

### Resposta da API (body)

```ts
type ApiBody = PreparoProducao[];
```

### Headers de paginação lidos pelo frontend

| Header | Uso |
|---|---|
| `x-total-count` | Total de itens (`totalItems`) |
| `x-per-page` | Itens por página (`itemsPerPage`; fallback = `limit`) |

### Resposta normalizada no frontend

```ts
interface OrdersResponse {
  data: PreparoProducao[];
  pagination: PaginationInfo;
}
```

### Exemplo

```http
GET /shared/kds/42/preparos/?terminalId=1&page=1&limit=20&where=status='preparoAguardandoProducao'&dataInicial=01/10/2026&dataFinal=16/10/2026
```

```json
[
  {
    "preparoProducaoId": 1001,
    "empresaId": 42,
    "pdvId": 3,
    "terminalId": 1,
    "keyId": 55,
    "status": "preparoAguardandoProducao",
    "numero": "A-123",
    "clienteNome": "João",
    "origem": "mesa",
    "observacao": null,
    "dataHoraStatus": "2026-10-16T12:00:00.000Z",
    "garcomId": 7,
    "createdAt": "2026-10-16T11:50:00.000Z",
    "updatedAt": "2026-10-16T12:00:00.000Z",
    "tempoPreparo": 15,
    "pdv": "PDV 1",
    "terminal": "Cozinha Quente",
    "comandaId": null,
    "comandaNumero": null,
    "mesaId": 4,
    "mesaNumero": 12,
    "contaId": 90,
    "contaNumero": 90,
    "exibirNumeroCartaoConta": false,
    "garcom": "Maria",
    "items": [
      {
        "preparoProducaoId": 1001,
        "preparoItemId": 2001,
        "produtoId": 300,
        "keyId": 55,
        "chaveId": "abc",
        "fichaTecnicaId": 10,
        "complemento": null,
        "observacao": "Sem cebola",
        "qtde": 1,
        "numeroItem": 1,
        "status": "preparoAguardandoProducao",
        "nome": "X-Burger",
        "adicionais": []
      }
    ],
    "tempoPreparoStatus": "tempoPreparoOk"
  }
]
```

---

## 5. Contagem de preparos por status

| Campo | Valor |
|---|---|
| **Método** | `GET` |
| **Endpoint** | `/shared/kds/:companyId/preparos/count` |
| **Hook** | `useOrderCount` (`src/hooks/useOrderCount.ts`) |
| **Tipo** | Query (React Query) |

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `companyId` | `number` | sim | ID da empresa |

### Parâmetros (query)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `terminalId` | `string` | não | Enviado apenas se `terminal !== "all"` |
| `dataInicial` | `string` | não | Formato `dd/MM/yyyy` |
| `dataFinal` | `string` | não | Formato `dd/MM/yyyy` |

### Resposta esperada

```ts
interface OrderCountResponse {
  empresaId: number;
  status: string;
  count: number;
  createdAt: string;
}

type Response = OrderCountResponse[];
```

### Exemplo

```http
GET /shared/kds/42/preparos/count?terminalId=1&dataInicial=01/10/2026&dataFinal=16/10/2026
```

```json
[
  {
    "empresaId": 42,
    "status": "preparoAguardandoProducao",
    "count": 5,
    "createdAt": "2026-10-16T00:00:00.000Z"
  },
  {
    "empresaId": 42,
    "status": "preparoEmProducao",
    "count": 3,
    "createdAt": "2026-10-16T00:00:00.000Z"
  }
]
```

---

## 6. Iniciar preparo

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/shared/kds/:companyId/preparos/:id/iniciar` |
| **Hook** | `useStartPreparation` (`src/hooks/useStartPreparation.ts`) |
| **Tipo** | Mutation (React Query) |
| **Body** | Nenhum |

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `companyId` | `number` | sim | ID da empresa |
| `id` | `number` | sim | `preparoProducaoId` |

### Resposta esperada

```ts
interface StartPreparationResponse {
  preparoProducaoId: number;
  status: string;
  dataHoraStatus: string;
}
```

### Side effects (onSuccess)

Invalida as queries: `order-count`, `load-orders-by-terminal`, `search-orders-across-pages`.

### Exemplo

```http
POST /shared/kds/42/preparos/1001/iniciar
```

```json
{
  "preparoProducaoId": 1001,
  "status": "preparoEmProducao",
  "dataHoraStatus": "2026-10-16T12:05:00.000Z"
}
```

---

## 7. Pausar preparo

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/shared/kds/:companyId/preparos/:id/pausar` |
| **Hook** | `usePausePreparation` (`src/hooks/usePausePreparation.ts`) |
| **Tipo** | Mutation (React Query) |
| **Body** | Nenhum |

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `companyId` | `number` | sim | ID da empresa |
| `id` | `number` | sim | `preparoProducaoId` |

### Resposta esperada

Tipagem **não declarada explicitamente** no hook. O retorno é o `data` do Axios (`unknown`/`any` implícito). Na prática, espera-se um objeto similar ao de iniciar:

```ts
// Tipagem inferida / esperada (não tipada no código)
interface PausePreparationResponse {
  preparoProducaoId: number;
  status: string; // tipicamente "preparoPausado"
  dataHoraStatus: string;
}
```

### Side effects (onSuccess)

Invalida as queries: `order-count`, `load-orders-by-terminal`, `search-orders-across-pages`.

### Exemplo

```http
POST /shared/kds/42/preparos/1001/pausar
```

---

## 8. Finalizar preparo

| Campo | Valor |
|---|---|
| **Método** | `POST` |
| **Endpoint** | `/shared/kds/:companyId/preparos/:id/finalizar` |
| **Hook** | `useFinishPreparation` (`src/hooks/useFinishPreparation.ts`) |
| **Tipo** | Mutation (React Query) |
| **Body** | Nenhum |

### Parâmetros (path)

| Nome | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `companyId` | `number` | sim | ID da empresa |
| `id` | `number` | sim | `preparoProducaoId` |

### Resposta esperada

Tipagem **não declarada explicitamente** no hook. Esperado de forma análoga:

```ts
// Tipagem inferida / esperada (não tipada no código)
interface FinishPreparationResponse {
  preparoProducaoId: number;
  status: string; // tipicamente "preparoFinalizado"
  dataHoraStatus: string;
}
```

### Side effects (onSuccess)

Invalida as queries: `order-count`, `load-orders-by-terminal`, `search-orders-across-pages`.

### Exemplo

```http
POST /shared/kds/42/preparos/1001/finalizar
```

---

## 9. WebSocket KDS

| Campo | Valor |
|---|---|
| **Protocolo** | WebSocket |
| **URL** | `VITE_KDS_WS_URL` (fallback `ws://179.127.4.150:8100`) |
| **Hook** | `useKdsRealtime` (`src/hooks/useKdsRealtime.ts`) |
| **Uso** | `KitchenManagementPage` — refetch da lista ao receber evento do terminal atual |

### Opções do hook

```ts
interface UseKdsRealtimeOptions {
  url?: string;
  companyId: number;
  onMessage?: (data: unknown) => void;
}

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
```

### Mensagem enviada no `onopen` (registro)

```ts
interface RegisterPayload {
  command: "@REGISTER@";
  id: number;      // companyId
  kind: "socketKds";
}
```

```json
{
  "command": "@REGISTER@",
  "id": 42,
  "kind": "socketKds"
}
```

### Mensagens recebidas

Tipagem no código: `unknown` (`KdsMessage`).

O consumidor (`KitchenManagementPage`) trata o payload de forma resiliente e tenta extrair o terminal de:

```ts
payload.terminalId
  ?? payload.terminal
  ?? payload.data?.terminalId
  ?? payload.data?.terminal
```

Se o terminal do evento coincidir com o terminal selecionado (ou se o filtro for `"all"`), dispara `refetch` da lista de preparos (com throttle de 500ms).

### Reconexão

Backoff exponencial: `min(30_000, 1000 * 2^retry)`, reiniciando o contador após conexão bem-sucedida.

---

## Resumo rápido

| # | Método | Endpoint | Hook | Tipagem de resposta |
|---|---|---|---|---|
| 1 | `POST` | `/shared/login` | `useLogin` | `OperadorResponse` |
| 2 | `GET` | `/shared/tenant/:tenantName` | `useLoadByTenantName` | `LoadByTenantNameResponse` |
| 3 | `GET` | `/shared/kds/:companyId/terminais` | `useLoadTerminals` | `Terminals[]` |
| 4 | `GET` | `/shared/kds/:companyId/preparos/` | `useLoadOrdersByTerminal` | `PreparoProducao[]` + headers → `OrdersResponse` |
| 5 | `GET` | `/shared/kds/:companyId/preparos/count` | `useOrderCount` | `OrderCountResponse[]` |
| 6 | `POST` | `/shared/kds/:companyId/preparos/:id/iniciar` | `useStartPreparation` | `StartPreparationResponse` |
| 7 | `POST` | `/shared/kds/:companyId/preparos/:id/pausar` | `usePausePreparation` | *(não tipada)* |
| 8 | `POST` | `/shared/kds/:companyId/preparos/:id/finalizar` | `useFinishPreparation` | *(não tipada)* |
| 9 | `WS` | `VITE_KDS_WS_URL` | `useKdsRealtime` | `unknown` |

---

## Observações

1. Datas no frontend entram como `yyyy-MM-dd` e são convertidas para `dd/MM/yyyy` antes de ir na query.
2. `useSearchOrdersAcrossPages` não é um endpoint novo: reutiliza o endpoint de preparos via `fetchAllOrdersByTerminal` e filtra no cliente.
3. Pausar e finalizar não têm interfaces TypeScript exportadas hoje — vale tipar no mesmo padrão de `StartPreparationResponse`.
4. O WebSocket não redefine o modelo de negócio: serve apenas como sinal para refetch.
)
