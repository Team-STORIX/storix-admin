import { apiClient } from './axios-instance'

export type NotificationType = 'MARKETING' | 'FEATURE_UPDATE' | 'TOS_UPDATE' | 'PRIVACY_UPDATE'
export type TargetAudience = 'ALL' | 'NEW_USERS' | 'EVENT_WINNERS'
export type SendType = 'IMMEDIATE' | 'SCHEDULED'
export type NotificationStatus = 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELED'
export type NotificationTargetType = 'NONE' | 'APP_EVENT' | 'EXTERNAL'

export type AdminNotificationListItem = {
  id: number
  title: string
  notificationType: NotificationType
  targetAudience: TargetAudience
  sendType: SendType
  scheduledAt: string | null
  status: NotificationStatus
  rebroadcastable: boolean
}

export type AdminNotification = AdminNotificationListItem & {
  content: string
  targetType: NotificationTargetType
  eventTargetId: number | null
  targetLink: string | null
  createdAt: string
  updatedAt: string
}

export type AdminNotificationPayload = {
  title: string
  content: string
  notificationType: NotificationType
  targetAudience: TargetAudience
  sendType: SendType
  scheduledAt?: string | null
  targetType: NotificationTargetType
  eventTargetId?: number | null
  targetLink?: string | null
}

export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type AdminNotificationListResult = {
  content: AdminNotificationListItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export const getAdminNotifications = async (
  page = 0,
): Promise<ApiEnvelope<AdminNotificationListResult>> => {
  const response = await apiClient.get('/api/v1/admin/notifications', {
    params: { page },
  })
  return response.data
}

export const getAdminNotification = async (
  adminNotificationId: number,
): Promise<ApiEnvelope<AdminNotification>> => {
  const response = await apiClient.get(`/api/v1/admin/notifications/${adminNotificationId}`)
  return response.data
}

export const createAdminNotification = async (
  data: AdminNotificationPayload,
): Promise<ApiEnvelope<number>> => {
  const response = await apiClient.post('/api/v1/admin/notifications', data)
  return response.data
}

export const updateAdminNotification = async (
  adminNotificationId: number,
  data: AdminNotificationPayload,
): Promise<ApiEnvelope<AdminNotification>> => {
  const response = await apiClient.put(`/api/v1/admin/notifications/${adminNotificationId}`, data)
  return response.data
}

export const broadcastAdminNotification = async (
  adminNotificationId: number,
): Promise<ApiEnvelope<object>> => {
  const response = await apiClient.post(`/api/v1/admin/notifications/${adminNotificationId}/broadcast`)
  return response.data
}

export const cancelAdminNotification = async (
  adminNotificationId: number,
): Promise<ApiEnvelope<AdminNotification>> => {
  const response = await apiClient.patch(`/api/v1/admin/notifications/${adminNotificationId}/cancel`)
  return response.data
}
