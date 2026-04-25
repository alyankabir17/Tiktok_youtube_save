import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000,
})

export const downloadAPI = {
  getInfo: (url: string) => api.post('/download/info', { url }),
  startDownload: (url: string, format: string, quality: string) =>
    api.post('/download/start', { url, format, quality }),
}

export default api