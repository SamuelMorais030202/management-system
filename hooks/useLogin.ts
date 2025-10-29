import { api } from "@/lib/api"; // Assumindo que você tem uma instância de Axios ou Fetch wrapper
import { useMutation } from "@tanstack/react-query";

export interface OperadorResponse {
  operadorId: number;
  pessoaId: number;
  codigo: number;
  userName: string;
  ativo: boolean;
}

export interface LoginPayload {
  userName: string;
  password: string;
  empresaId?: number;
} 

async function loginUser(payload: LoginPayload): Promise<OperadorResponse> {
  const url = `/shared/login`;
  
  // Assumindo que 'api' lida com requisições POST
  const { data } = await api.post(url, payload);
  
  // Em uma implementação real, você armazenaria os dados da sessão aqui:
  // setSessionCookie(data); 

  return data;
}

export function useLogin() {
  return useMutation<OperadorResponse, Error, LoginPayload>({
    mutationFn: loginUser,
    // Você pode adicionar um onSuccess para redirecionar após o login
    // onSuccess: (data) => {
    //   console.log("Login successful:", data);
    // },
    // onError: (error) => {
    //   console.error("Login failed:", error);
    // }
  });
}