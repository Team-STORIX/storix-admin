import { apiClient } from './axios-instance'
import type { ApiEnvelope, PageQuery, PageResult } from './types'

export type UserAccountState = 'NORMAL' | 'DELETED' | 'SUSPENDED'
export type OAuthProvider = 'KAKAO' | 'NAVER' | 'X' | 'GOOGLE' | 'APPLE'
export type SanctionType = 'SUSPENDED' | 'WITHDRAWN' | 'RESTORED' | 'CONTENT_DELETED'
export type SanctionSource = 'REPORT' | 'MANUAL'
export type UserContentType = 'FEED' | 'FEED_REPLY' | 'REVIEW' | 'TOPIC_ROOM' | 'CHAT'

export type AdminUser = {
  userId: number
  nickName: string
  email: string
  oauthProvider: OAuthProvider | string
  joinedAt: string
  accountState: UserAccountState
  suspendedUntil?: string
  lastLoginAt?: string
  reportedCount: number
}

export type AdminUserListResult = PageResult<AdminUser>

export type AdminUserDetail = AdminUser & {
  activityStats: {
    boardCount: number
    replyCount: number
    topicRoomParticipationCount: number
    reviewCount: number
    reportedCount: number
  }
}

export type AdminUserContent = {
  contentId: number
  type: UserContentType
  boardId?: number
  parentReplyId?: number
  roomId?: number
  worksId?: number
  content: string
  rating?: string
  messageType?: string
  likeCount: number
  replyCount: number
  createdAt: string
}

export type AdminUserSanction = {
  sanctionId: number
  type: SanctionType
  source: SanctionSource | string
  reportCaseId?: number
  adminId: number
  adminNickName: string
  startedAt: string
  endedAt?: string
  memo?: string
  createdAt: string
}

export type CreateSanctionRequest = {
  type: SanctionType
  targetType?: UserContentType | null
  targetId?: number | null
  memo?: string
}

export type AdminUserListParams = PageQuery & {
  userId?: number
  nickName?: string
  state?: UserAccountState
}

const BASE = '/api/v1/admin/users'

export const getAdminUsers = async (params?: AdminUserListParams) => {
  const response = await apiClient.get<ApiEnvelope<AdminUserListResult>>(BASE, { params })
  return response.data
}

export const getAdminUser = async (userId: number) => {
  const response = await apiClient.get<ApiEnvelope<AdminUserDetail>>(`${BASE}/${userId}`)
  return response.data
}

export const getAdminUserContents = async (userId: number, params?: PageQuery) => {
  const response = await apiClient.get<ApiEnvelope<PageResult<AdminUserContent>>>(
    `${BASE}/${userId}/contents`,
    { params },
  )
  return response.data
}

export const getAdminUserSanctions = async (userId: number, params?: PageQuery) => {
  const response = await apiClient.get<ApiEnvelope<PageResult<AdminUserSanction>>>(
    `${BASE}/${userId}/sanctions`,
    { params },
  )
  return response.data
}

export const createAdminUserSanction = async (userId: number, data: CreateSanctionRequest) => {
  const response = await apiClient.post<ApiEnvelope<object>>(`${BASE}/${userId}/sanctions`, data)
  return response.data
}
