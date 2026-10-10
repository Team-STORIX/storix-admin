import { apiClient } from './axios-instance'
import type { ApiEnvelope } from './types'

export type AdminLoginRequest = {
  email: string
  password: string
}

export type AdminTokens = {
  accessToken: string
  refreshToken: string
}

export type AdminProfile = {
  nickName: string
  email: string
}

export type AdminLoginResponse = ApiEnvelope<AdminTokens>
export type AdminProfileResponse = ApiEnvelope<AdminProfile>

/**
 * 관리자 로그인
 */
export const adminLogin = async (data: AdminLoginRequest) => {
  const response = await apiClient.post<AdminLoginResponse>('/api/v1/auth/admin/login', data)
  return response.data
}

/**
 * 관리자 프로필 조회
 */
export const getAdminProfile = async () => {
  const response = await apiClient.get<AdminProfileResponse>('/api/v1/auth/admin/profile')
  return response.data
}
