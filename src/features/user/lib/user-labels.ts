import type { SanctionType, UserAccountState, UserContentType } from '@/lib/api/user.api'

export const userColumns = [
  { key: 'userId', label: '유저 ID' },
  { key: 'nickName', label: '닉네임' },
  { key: 'oauthProvider', label: '소셜 로그인' },
  { key: 'joinedAt', label: '가입일' },
  { key: 'accountState', label: '계정 상태' },
  { key: 'reportedCount', label: '신고 횟수' },
  { key: 'actions', label: '작업' },
] as const

export const accountStateDesigns: Record<UserAccountState, { label: string; className: string }> = {
  NORMAL: { label: '활성', className: 'user-state-normal' },
  SUSPENDED: { label: '정지', className: 'user-state-suspended' },
  DELETED: { label: '탈퇴', className: 'user-state-deleted' },
}

export const providerLabels: Record<string, string> = {
  KAKAO: '카카오',
  NAVER: '네이버',
  X: 'X',
  GOOGLE: '구글',
  APPLE: '애플',
}

export const contentTypeLabels: Record<UserContentType, string> = {
  FEED: '피드',
  FEED_REPLY: '댓글',
  REVIEW: '리뷰',
  TOPIC_ROOM: '토픽룸',
  CHAT: '채팅',
}

export const sanctionTypeLabels: Record<SanctionType, string> = {
  SUSPENDED: '계정 정지',
  WITHDRAWN: '계정 삭제',
  RESTORED: '계정 복구',
  CONTENT_DELETED: '콘텐츠 삭제',
}

/** 계정 제재 모달에서 선택 가능한 제재 */
export type AccountSanctionAction = Extract<SanctionType, 'SUSPENDED' | 'WITHDRAWN'>

export const accountSanctionOptions: Array<{ value: AccountSanctionAction; title: string; description: string }> = [
  { value: 'SUSPENDED', title: '계정 정지', description: '7일 임시 정지 · 만료 시 자동 활성화' },
  { value: 'WITHDRAWN', title: '계정 삭제', description: '유저 강제 탈퇴' },
]

export const formatProvider = (provider: string) => providerLabels[provider] ?? provider
