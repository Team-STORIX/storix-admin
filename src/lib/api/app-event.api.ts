import { apiClient } from './axios-instance'

export type AppEventStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELED'
export type AppEventType = 'GENERAL' | 'ATTENDANCE' | 'STORY_CARD'
export type PromotionType = 'PUSH' | 'POPUP' | 'BANNER'
export type AttendanceRewards = Record<string, number>

export type AppEvent = {
  id: number
  name: string
  description: string
  eventType: AppEventType
  startAt: string
  endAt: string
  status: AppEventStatus
  hasWinner: boolean
  promotionTypes: PromotionType[]
  attendanceRewards: AttendanceRewards
  createdAt: string
  updatedAt: string
}

export type AppEventPayload = {
  name: string
  description: string
  eventType: AppEventType
  startAt: string
  endAt: string
  hasWinner: boolean
  promotionTypes: PromotionType[]
  attendanceRewards: AttendanceRewards
}

export type AppEventDrawWinner = {
  drawOrder: number
  userId: number
  nickName: string | null
}

export type AppEventWinnerDrawResult = {
  appEventId: number
  alreadyFinalized: boolean
  winners: AppEventDrawWinner[]
}

export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

export type AppEventListResult = {
  content: AppEvent[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export const getAppEvents = async (
  page = 0,
  keyword?: string,
): Promise<ApiEnvelope<AppEventListResult>> => {
  const response = await apiClient.get('/api/v1/admin/app-events', {
    params: {
      page,
      ...(keyword ? { keyword } : {}),
    },
  })
  return response.data
}

export const getAppEvent = async (appEventId: number): Promise<ApiEnvelope<AppEvent>> => {
  const response = await apiClient.get(`/api/v1/admin/app-events/${appEventId}`)
  return response.data
}

export const createAppEvent = async (
  data: AppEventPayload,
): Promise<ApiEnvelope<AppEvent>> => {
  const response = await apiClient.post('/api/v1/admin/app-events', data)
  return response.data
}

export const updateAppEvent = async (
  appEventId: number,
  data: AppEventPayload,
): Promise<ApiEnvelope<AppEvent>> => {
  const response = await apiClient.put(`/api/v1/admin/app-events/${appEventId}`, data)
  return response.data
}

export const cancelAppEvent = async (
  appEventId: number,
): Promise<ApiEnvelope<AppEvent>> => {
  const response = await apiClient.patch(`/api/v1/admin/app-events/${appEventId}/cancel`)
  return response.data
}

export const drawAppEventWinners = async (
  appEventId: number,
  winnerCount: number,
): Promise<ApiEnvelope<AppEventWinnerDrawResult>> => {
  const response = await apiClient.post(`/api/v1/admin/app-events/${appEventId}/winners`, {
    winnerCount,
  })
  return response.data
}
