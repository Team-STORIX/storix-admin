import { apiClient } from './axios-instance'
import { buildMultipartBody } from './multipart'
import type { ApiEnvelope, PageResult } from './types'

export type PopupStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELED'
export type PopupContentTargetType = 'APP_EVENT'
export type PopupExposurePolicy = 'ALWAYS_DURING_PERIOD' | 'ONCE_PER_DAY'

export type AdminPopup = {
  id: number
  targetId: number
  contentTargetType: PopupContentTargetType
  exposurePolicy: PopupExposurePolicy
  popupTitle: string
  imageUrl: string
  content: string
  ctaText: string
  displayStartAt: string
  displayEndAt: string
  status: PopupStatus
  createdAt: string
  updatedAt: string
}

export type AdminPopupPayload = {
  appEventId: number
  contentTargetType: PopupContentTargetType
  exposurePolicy: PopupExposurePolicy
  popupTitle: string
  content: string
  ctaText: string
  displayStartAt: string
  displayEndAt: string
}

export type AdminPopupListResult = PageResult<AdminPopup>

const BASE = '/api/v1/admin/popups'

export const getAdminPopups = async (page = 0, keyword?: string) => {
  const response = await apiClient.get<ApiEnvelope<AdminPopupListResult>>(BASE, {
    params: { page, ...(keyword ? { keyword } : {}) },
  })
  return response.data
}

export const getAdminPopup = async (popupId: number) => {
  const response = await apiClient.get<ApiEnvelope<AdminPopup>>(`${BASE}/${popupId}`)
  return response.data
}

export const createAdminPopup = async (data: AdminPopupPayload, file: File) => {
  const response = await apiClient.post<ApiEnvelope<AdminPopup>>(BASE, buildMultipartBody(data, file))
  return response.data
}

export const updateAdminPopup = async (popupId: number, data: AdminPopupPayload, file?: File | null) => {
  const response = await apiClient.put<ApiEnvelope<AdminPopup>>(
    `${BASE}/${popupId}`,
    buildMultipartBody(data, file),
  )
  return response.data
}

export const cancelAdminPopup = async (popupId: number) => {
  const response = await apiClient.patch<ApiEnvelope<AdminPopup>>(`${BASE}/${popupId}/cancel`)
  return response.data
}
