// utils/axiosInstance.js
import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: 'https://api.dev.alhpaorbit.com/api/'
})

// Request interceptor to attach access token
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('accessToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => Promise.reject(error)
)

// Response interceptor for handling 401 errors and refreshing tokens
axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')

        if (!refreshToken) throw new Error('No refresh token')

        const response = await axios.post('https://api.dev.alhpaorbit.com/api/jwt-token/refresh/', {
          refresh: refreshToken
        })

        localStorage.setItem('accessToken', response.data.access)
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`

        return axiosInstance(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
