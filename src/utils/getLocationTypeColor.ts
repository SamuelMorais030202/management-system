export const getLocationTypeColor = (name: string): string => {
  // Cores de fundo do Tailwind CSS a serem usadas
  const colorClasses = [
    'bg-blue-500', 
    'bg-green-500', 
    'bg-red-500', 
    'bg-yellow-500', 
    'bg-purple-500', 
    'bg-indigo-500',
    'bg-pink-500',
    'bg-cyan-500'
  ];

  // Algoritmo de Hashing: Soma os códigos ASCII dos caracteres
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Usa o módulo (resto da divisão) para mapear o hash para um índice do array de cores
  const index = Math.abs(hash) % colorClasses.length;

  return colorClasses[index];
};