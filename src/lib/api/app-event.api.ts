import { apiClient } from './axios-instance'
import type { ApiEnvelope, PageResult } from './types'

export type { ApiEnvelope } from './types'

export type AppEventStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELED'
export type AppEventType = 'GENERAL' | 'ATTENDANCE' | 'STORY_CARD'
export type PromotionType = 'PUSH' | 'POPUP' | 'BANNER'
/** 출석일(문자열) → 누적 응모권 수 */
export type AttendanceRewards = Record<string, number>

export type AppEvent = {
  id: number
  name: string
  description: string
  eventType: AppEventType
  pageKey: string | null
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
  pageKey?: string | null
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

export type AttendanceEventWinner = AppEventDrawWinner & {
  ticketCount: number
  totalAttendedDays: number
}

export type AttendanceEventWinnerResult = {
  appEventId: number
  candidateCount: number
  totalTickets: number
  winners: AttendanceEventWinner[]
}

export type AppEventListResult = PageResult<AppEvent>

const BASE = '/api/v1/admin/app-events'

export const getAppEvents = async (page = 0, keyword?: string) => {
  const response = await apiClient.get<ApiEnvelope<AppEventListResult>>(BASE, {
    params: { page, ...(keyword ? { keyword } : {}) },
  })
  return response.data
}

export const getAppEvent = async (appEventId: number) => {
  const response = await apiClient.get<ApiEnvelope<AppEvent>>(`${BASE}/${appEventId}`)
  return response.data
}

export const createAppEvent = async (data: AppEventPayload) => {
  const response = await apiClient.post<ApiEnvelope<AppEvent>>(BASE, data)
  return response.data
}

export const updateAppEvent = async (appEventId: number, data: AppEventPayload) => {
  const response = await apiClient.put<ApiEnvelope<AppEvent>>(`${BASE}/${appEventId}`, data)
  return response.data
}

export const cancelAppEvent = async (appEventId: number) => {
  const response = await apiClient.patch<ApiEnvelope<AppEvent>>(`${BASE}/${appEventId}/cancel`)
  return response.data
}

export const drawAppEventWinners = async (appEventId: number, winnerCount: number) => {
  const response = await apiClient.post<ApiEnvelope<AppEventWinnerDrawResult>>(
    `${BASE}/${appEventId}/winners`,
    { winnerCount },
  )
  return response.data
}

export const getAttendanceEventWinners = async (appEventId: number) => {
  const response = await apiClient.get<ApiEnvelope<AttendanceEventWinnerResult>>(
    `/api/v1/admin/attendance-events/${appEventId}/winners`,
  )
  return response.data
}
