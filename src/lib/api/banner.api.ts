import { apiClient } from './axios-instance'
import { buildMultipartBody } from './multipart'
import type { ApiEnvelope, PageResult } from './types'

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

export type AdminBannerListResult = PageResult<AdminBanner>

const BASE = '/api/v1/admin/banners'

export const getAdminBanners = async (page = 0, keyword?: string) => {
  const response = await apiClient.get<ApiEnvelope<AdminBannerListResult>>(BASE, {
    params: { page, ...(keyword ? { keyword } : {}) },
  })
  return response.data
}

export const getAdminBanner = async (bannerId: number) => {
  const response = await apiClient.get<ApiEnvelope<AdminBanner>>(`${BASE}/${bannerId}`)
  return response.data
}

export const createAdminBanner = async (data: AdminBannerPayload, file: File) => {
  const response = await apiClient.post<ApiEnvelope<AdminBanner>>(BASE, buildMultipartBody(data, file))
  return response.data
}

export const updateAdminBanner = async (bannerId: number, data: AdminBannerPayload, file?: File | null) => {
  const response = await apiClient.put<ApiEnvelope<AdminBanner>>(
    `${BASE}/${bannerId}`,
    buildMultipartBody(data, file),
  )
  return response.data
}

export const cancelAdminBanner = async (bannerId: number) => {
  const response = await apiClient.patch<ApiEnvelope<AdminBanner>>(`${BASE}/${bannerId}/cancel`)
  return response.data
}
