import type { AppEvent, AppEventStatus, AppEventType, PromotionType } from '@/lib/api/app-event.api'

export const eventTypeLabels: Record<AppEventType, string> = {
  GENERAL: '일반',
  ATTENDANCE: '출석 체크',
  STORY_CARD: '오늘의 스토리 카드',
}

/** 생성 폼의 유형 선택 순서 */
export const eventTypes: AppEventType[] = ['ATTENDANCE', 'STORY_CARD', 'GENERAL']

export const promotionTypes: PromotionType[] = ['PUSH', 'POPUP', 'BANNER']

export const promotionDesigns: Record<PromotionType, { label: string; className: string }> = {
  PUSH: { label: '푸시', className: 'event-type-push' },
  POPUP: { label: '팝업', className: 'event-type-popup' },
  BANNER: { label: '배너', className: 'event-type-banner' },
}

export const statusDesigns: Record<AppEventStatus, { label: string; className: string }> = {
  SCHEDULED: { label: '예약 대기', className: 'event-state-scheduled' },
  ACTIVE: { label: '진행 중', className: 'event-state-active' },
  ENDED: { label: '종료 완료', className: 'event-state-ended' },
  CANCELED: { label: '강제 종료', className: 'event-state-canceled' },
}

export const eventColumns = [
  { key: 'id', label: 'appEventID' },
  { key: 'name', label: '이벤트 명' },
  { key: 'period', label: '이벤트 기간' },
  { key: 'children', label: '이벤트 하위 목록' },
  { key: 'actions', label: '작업' },
] as const

export const DEFAULT_ATTENDANCE_REWARD_LABEL = '기본 지급표 (3일 1개, 7일 2개, 12일 5개)'

export const getDefaultWinnerPushTitle = (event: AppEvent) => `[당첨 안내] ${event.name}`

export const getDefaultWinnerPushContent = (event: AppEvent) =>
  `${event.name} 이벤트에 당첨되셨어요. 자세한 내용은 앱에서 확인해주세요.`
