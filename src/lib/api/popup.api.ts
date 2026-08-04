import { apiClient } from './axios-instance'

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

export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type AdminPopupListResult = {
  content: AdminPopup[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export const getAdminPopups = async (
  page = 0,
  keyword?: string,
): Promise<ApiEnvelope<AdminPopupListResult>> => {
  const response = await apiClient.get('/api/v1/admin/popups', {
    params: {
      page,
      ...(keyword ? { keyword } : {}),
    },
  })
  return response.data
}

export const getAdminPopup = async (popupId: number): Promise<ApiEnvelope<AdminPopup>> => {
  const response = await apiClient.get(`/api/v1/admin/popups/${popupId}`)
  return response.data
}

export const createAdminPopup = async (
  data: AdminPopupPayload,
  file: File,
): Promise<ApiEnvelope<AdminPopup>> => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  formData.append('file', file)

  const response = await apiClient.post('/api/v1/admin/popups', formData)
  return response.data
}

export const updateAdminPopup = async (
  popupId: number,
  data: AdminPopupPayload,
  file?: File | null,
): Promise<ApiEnvelope<AdminPopup>> => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (file) {
    formData.append('file', file)
  }

  const response = await apiClient.put(`/api/v1/admin/popups/${popupId}`, formData)
  return response.data
}

export const cancelAdminPopup = async (popupId: number): Promise<ApiEnvelope<AdminPopup>> => {
  const response = await apiClient.patch(`/api/v1/admin/popups/${popupId}/cancel`)
  return response.data
}
