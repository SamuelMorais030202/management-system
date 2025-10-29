"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { useLoadByTenantName } from "@/hooks/useLoadByTenantName";
import { useLogin } from "@/hooks/useLogin";
import { redirect, useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant?.toString();
  
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!tenant) redirect('/');
  
  const { data: tenantData, isLoading: isLoadingTenant } = useLoadByTenantName(tenant);
  const empresaId = tenantData?.empresaId;

  const { mutate, isPending } = useLogin(); 

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!userName || !password || empresaId === null) {
      setErrorMessage("Preencha todas as credenciais.");
      return;
    }
    
    mutate({
      userName,
      password,
      empresaId,
    }, {
      onSuccess: (data) => {
        console.log("Login bem-sucedido. Dados do operador:", data);
        
        router.push(`/private/${tenant}/${empresaId}/view`); 
      },
      onError: (error) => {
        console.error("Erro no Login:", error);
        setErrorMessage("Falha na autenticação. Verifique o usuário e a senha.");
      }
    });
  };
  
  if (isLoadingTenant || isPending) {
    return (
      <p>Carregando...</p>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl font-bold text-center mb-4">Login de Operador</h1>
      <p className="text-sm text-center text-gray-600 mb-6">Empresa: {tenant}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="userName" className="text-sm font-medium">Usuário</label>
          <Input
            id="userName"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="text-sm font-medium">Senha</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        
        {errorMessage && (
          <p className="text-sm text-red-500 text-center">{errorMessage}</p>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={isPending}
        >
          {isPending ? 'Autenticando...' : 'Entrar'}
        </Button>
      </form>
      
      <p className="mt-4 text-xs text-center text-gray-400">ID da Empresa: {empresaId ?? 'Aguardando...'}</p>
    </div>
  );
}