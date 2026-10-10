import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearAccessToken, readAccessToken, storeAccessToken } from '../auth/access-token'

// 토큰이 필요 없는(그리고 401이어도 갱신을 시도하면 안 되는) 엔드포인트
const NO_AUTH_PATHS = ['/auth/admin/login', '/auth/admin/signup'] as const

const isNoAuthEndpoint = (url?: string) =>
  !!url && NO_AUTH_PATHS.some((path) => url.includes(path))

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const apiClient = axios.create({
  baseURL: '',
  timeout: 10_000,
  withCredentials: true, // 리프레시 토큰 쿠키 전송을 위해 필요
})

// 요청 인터셉터 - 액세스 토큰 추가
apiClient.interceptors.request.use((config) => {
  if (isNoAuthEndpoint(config.url)) return config

  const accessToken = readAccessToken()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// 응답 인터셉터 - 401 시 토큰 갱신 후 1회 재시도
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined

    if (!originalRequest || error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      // 리프레시 토큰은 쿠키에 저장되어 있으므로 자동으로 전송됨
      const response = await axios.post('/api/v1/auth/tokens/refresh', {}, { withCredentials: true })
      const newAccessToken: string | undefined = response.data?.result?.accessToken

      if (newAccessToken) {
        storeAccessToken(newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return apiClient(originalRequest)
      }
    } catch (refreshError) {
      // 리프레시 실패 시 로그아웃 처리
      clearAccessToken()
      window.location.href = '/'
      return Promise.reject(refreshError)
    }

    return Promise.reject(error)
  },
)
