import type { ProcessAction, ReportStatus, TargetType } from '@/lib/api/report.api'

export const reportTargetTypeLabels: Record<TargetType, string> = {
  FEED: '피드',
  FEED_REPLY: '피드 댓글',
  REVIEW: '리뷰',
  TOPIC_ROOM: '토픽룸',
  CHAT: '채팅',
}

export const reportStatusLabels: Record<ReportStatus, string> = {
  RECEIVED: '접수',
  COMPLETED: '처리완료',
  REJECTED: '반려',
}

/** 상태 배지 클래스 (badge n/g/a) */
export const reportStatusBadgeClasses: Record<ReportStatus, string> = {
  RECEIVED: 'badge n',
  COMPLETED: 'badge g',
  REJECTED: 'badge a',
}

export const processActionLabels: Record<ProcessAction, string> = {
  CONTENT_DELETED: '콘텐츠 삭제',
  ACCOUNT_SUSPENDED: '계정 정지',
  ACCOUNT_DELETED: '계정 삭제',
}

export const processActionDescriptions: Record<ProcessAction, string> = {
  CONTENT_DELETED: '피신고 콘텐츠 삭제',
  ACCOUNT_SUSPENDED: '피신고 유저 7일 일시 정지 · 팝업 시 메세지 활성화',
  ACCOUNT_DELETED: '피신고 유저 강제 탈퇴',
}

export const processActions: ProcessAction[] = ['CONTENT_DELETED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_DELETED']

/** 필터 select 표시 순서 */
export const reportTargetTypes: TargetType[] = ['FEED', 'FEED_REPLY', 'REVIEW', 'TOPIC_ROOM', 'CHAT']
export const reportStatuses: ReportStatus[] = ['RECEIVED', 'REJECTED', 'COMPLETED']

/** 콘텐츠 삭제 처리가 가능한 신고 유형 */
const contentDeletableTargetTypes: TargetType[] = ['FEED', 'FEED_REPLY', 'REVIEW', 'CHAT']

export const isContentDeletable = (targetType: TargetType) => contentDeletableTargetTypes.includes(targetType)

export const reportColumnCount = 6
