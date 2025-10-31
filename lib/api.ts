import axios from 'axios'

const baseURL =
  process.env.BASE_URL || "http://179.127.4.150:8095/orion/v1"

export const api = axios.create({
  baseURL,
  timeout: 10000,
})
