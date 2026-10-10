import { apiClient } from './axios-instance'
import type { ApiEnvelope, PageResult } from './types'

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

export type AdminNotificationListResult = PageResult<AdminNotificationListItem>

const BASE = '/api/v1/admin/notifications'

export const getAdminNotifications = async (page = 0) => {
  const response = await apiClient.get<ApiEnvelope<AdminNotificationListResult>>(BASE, {
    params: { page },
  })
  return response.data
}

export const getAdminNotification = async (adminNotificationId: number) => {
  const response = await apiClient.get<ApiEnvelope<AdminNotification>>(`${BASE}/${adminNotificationId}`)
  return response.data
}

/** 생성 결과로 알림 ID를 돌려준다. */
export const createAdminNotification = async (data: AdminNotificationPayload) => {
  const response = await apiClient.post<ApiEnvelope<number>>(BASE, data)
  return response.data
}

export const updateAdminNotification = async (adminNotificationId: number, data: AdminNotificationPayload) => {
  const response = await apiClient.put<ApiEnvelope<AdminNotification>>(`${BASE}/${adminNotificationId}`, data)
  return response.data
}

export const broadcastAdminNotification = async (adminNotificationId: number) => {
  const response = await apiClient.post<ApiEnvelope<object>>(`${BASE}/${adminNotificationId}/broadcast`)
  return response.data
}

export const cancelAdminNotification = async (adminNotificationId: number) => {
  const response = await apiClient.patch<ApiEnvelope<AdminNotification>>(`${BASE}/${adminNotificationId}/cancel`)
  return response.data
}
