import axios from 'axios'

const baseURL =
  import.meta.env.VITE_BASE_URL || "https://api.unisystem.ddns.com.br/orion/v1"

export const api = axios.create({
  baseURL,
  timeout: 10000,
})
