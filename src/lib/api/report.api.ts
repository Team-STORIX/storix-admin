import { apiClient } from './axios-instance'
import type { ApiEnvelope, PageQuery } from './types'

export type TargetType = 'FEED' | 'FEED_REPLY' | 'REVIEW' | 'TOPIC_ROOM' | 'CHAT'
export type ReportStatus = 'RECEIVED' | 'REJECTED' | 'COMPLETED'
export type ProcessAction = 'CONTENT_DELETED' | 'ACCOUNT_SUSPENDED' | 'ACCOUNT_DELETED'

export type ReportListItem = {
  reportCaseId: number
  targetType: TargetType
  targetId: number
  reportedUserId: number
  reportedUserNickName: string
  status: ReportStatus
  reportCount: number
  processedByAdminId?: number
  processActions?: ProcessAction[]
  createdAt: string
  processedAt?: string
  reopened: boolean
}

/** 신고 목록은 Spring Page 형태 그대로 내려온다. */
export type ReportListResult = {
  totalPages: number
  totalElements: number
  last: boolean
  first: boolean
  numberOfElements: number
  size: number
  content: ReportListItem[]
  number: number
  empty: boolean
}

export type ReportListResponse = ApiEnvelope<ReportListResult>

export type ReportChatMessage = {
  messageId: number
  senderId: number
  senderNickName: string
  message: string
  messageType: string
  createdAt: string
}

export type ReportDetail = {
  reportCaseId: number
  targetType: TargetType
  targetId: number
  status: ReportStatus
  processedByAdminId?: number
  processMemo?: string
  processActions?: ProcessAction[]
  receivedAt: string
  processedAt?: string
  reopened: boolean
  summary: {
    reportedUserId: number
    reportedUserNickName: string
    location: string
    reason: string
    otherReason?: string
    reportCount: number
    firstReportedAt: string
  }
  reports: Array<{
    reportId: number
    reporterId: number
    reporterNickName: string
    reportedUserId: number
    reason: string
    otherReason?: string
    reportedAt: string
  }>
  reportedContent: {
    targetType: TargetType
    targetId: number
    parentTargetId?: number
    authorUserId: number
    authorNickName: string
    content: string
    createdAt: string
    chatMessages?: ReportChatMessage[]
  }
}

export type ReportDetailResponse = ApiEnvelope<ReportDetail>

export type ReportListParams = PageQuery & {
  targetType?: TargetType
  status?: ReportStatus
  startAt?: string
  endAt?: string
  reportedUserId?: number
  reportedUserKeyword?: string
}

export type ProcessReportRequest = {
  status: ReportStatus
  processActions?: ProcessAction[]
  processMemo?: string
}

export type ProcessReportResponse = ApiEnvelope<object>

const BASE = '/api/v1/admin/reports'

/**
 * 신고 목록 조회
 */
export const getReportList = async (params?: ReportListParams) => {
  const response = await apiClient.get<ReportListResponse>(BASE, { params })
  return response.data
}

/**
 * 신고 상세 조회
 */
export const getReportDetail = async (reportCaseId: number) => {
  const response = await apiClient.get<ReportDetailResponse>(`${BASE}/${reportCaseId}`)
  return response.data
}

/**
 * 신고 처리
 */
export const processReport = async (reportCaseId: number, data: ProcessReportRequest) => {
  const response = await apiClient.patch<ProcessReportResponse>(`${BASE}/${reportCaseId}`, data)
  return response.data
}
