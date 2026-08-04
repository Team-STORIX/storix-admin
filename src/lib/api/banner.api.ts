import { apiClient } from './axios-instance'

export type BannerStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELED'
export type BannerContentTargetType = 'APP_EVENT'

export type AdminBanner = {
  id: number
  targetId: number
  contentTargetType: BannerContentTargetType
  bannerTitle: string
  imageUrl: string
  displayStartAt: string
  displayEndAt: string
  status: BannerStatus
  createdAt: string
  updatedAt: string
}

export type AdminBannerPayload = {
  appEventId: number
  contentTargetType: BannerContentTargetType
  bannerTitle: string
  displayStartAt: string
  displayEndAt: string
}

export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type AdminBannerListResult = {
  content: AdminBanner[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export const getAdminBanners = async (
  page = 0,
  keyword?: string,
): Promise<ApiEnvelope<AdminBannerListResult>> => {
  const response = await apiClient.get('/api/v1/admin/banners', {
    params: {
      page,
      ...(keyword ? { keyword } : {}),
    },
  })
  return response.data
}

export const getAdminBanner = async (bannerId: number): Promise<ApiEnvelope<AdminBanner>> => {
  const response = await apiClient.get(`/api/v1/admin/banners/${bannerId}`)
  return response.data
}

export const createAdminBanner = async (
  data: AdminBannerPayload,
  file: File,
): Promise<ApiEnvelope<AdminBanner>> => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  formData.append('file', file)

  const response = await apiClient.post('/api/v1/admin/banners', formData)
  return response.data
}

export const updateAdminBanner = async (
  bannerId: number,
  data: AdminBannerPayload,
  file?: File | null,
): Promise<ApiEnvelope<AdminBanner>> => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (file) {
    formData.append('file', file)
  }

  const response = await apiClient.put(`/api/v1/admin/banners/${bannerId}`, formData)
  return response.data
}

export const cancelAdminBanner = async (bannerId: number): Promise<ApiEnvelope<AdminBanner>> => {
  const response = await apiClient.patch(`/api/v1/admin/banners/${bannerId}/cancel`)
  return response.data
}
