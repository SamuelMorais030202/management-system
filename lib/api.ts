import axios from 'axios'

const baseURL =
  process.env.BASE_URL || // ← variável para uso no servidor
  process.env.NEXT_PUBLIC_BASE_URL // ← variável exposta ao client (fallback)

export const api = axios.create({
  baseURL,
  timeout: 10000,
})
