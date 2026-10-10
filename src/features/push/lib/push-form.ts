import type {
  AdminNotificationPayload,
  NotificationStatus,
  NotificationTargetType,
  NotificationType,
  SendType,
  TargetAudience,
} from '@/lib/api/notification.api'
import { toLocalDateTimeString } from '@/lib/utils/date-format'
import {
  isCurrentMarketingPushTimeAllowed,
  isMarketingPushDateTimeAllowed,
  MARKETING_PUSH_TIME_LABEL,
} from '@/lib/utils/notification-rules'

export const notificationTypeLabels: Record<NotificationType, string> = {
  MARKETING: '마케팅',
  FEATURE_UPDATE: '신기능',
  TOS_UPDATE: '약관 변경',
  PRIVACY_UPDATE: '개인정보 처리방침',
}

export const targetAudienceLabels: Record<TargetAudience, string> = {
  ALL: '전체 유저',
  NEW_USERS: '신규 유저',
  EVENT_WINNERS: '이벤트 당첨자',
}

export const sendTypeLabels: Record<SendType, string> = {
  IMMEDIATE: '즉시 발송',
  SCHEDULED: '예약 발송',
}

export const notificationTargetTypeLabels: Record<NotificationTargetType, string> = {
  NONE: '없음',
  APP_EVENT: '앱 이벤트',
  EXTERNAL: '외부 URL',
}

/** 이동 대상 select 표시 순서 */
export const notificationTargetTypeOptions: Array<{ value: NotificationTargetType; label: string }> = [
  { value: 'APP_EVENT', label: '앱 이벤트' },
  { value: 'EXTERNAL', label: '외부 URL' },
  { value: 'NONE', label: '없음' },
]

export const notificationStatusLabels: Record<NotificationStatus, string> = {
  SCHEDULED: '예약됨',
  SENDING: '발송 중',
  SENT: '발송완료',
  FAILED: '실패',
  CANCELED: '취소됨',
}

export const notificationStatusClasses: Record<NotificationStatus, string> = {
  SCHEDULED: 'event-state-scheduled',
  SENDING: 'event-state-active',
  SENT: 'event-state-active',
  FAILED: 'event-state-canceled',
  CANCELED: 'event-state-ended',
}

export const pushColumnCount = 8

export type PushFormState = {
  title: string
  content: string
  notificationType: NotificationType
  targetAudience: TargetAudience
  sendType: SendType
  scheduledAt: string
  targetType: NotificationTargetType
  eventTargetId: string
  targetLink: string
}

export const emptyPushForm: PushFormState = {
  title: '',
  content: '',
  notificationType: 'MARKETING',
  targetAudience: 'ALL',
  sendType: 'IMMEDIATE',
  scheduledAt: '',
  targetType: 'APP_EVENT',
  eventTargetId: '',
  targetLink: '',
}

/**
 * 인앱 이벤트 상세의 "푸시 관리에서 작성" 링크로 진입한 경우
 * 쿼리스트링(targetAudience=EVENT_WINNERS&eventTargetId=…)으로 당첨자 푸시 폼을 미리 채운다.
 */
export function getWinnerPushPrefill(search: string): PushFormState | null {
  const params = new URLSearchParams(search)
  const eventTargetId = params.get('eventTargetId')
  const targetAudience = params.get('targetAudience')
  const targetType = params.get('targetType')

  if (targetAudience !== 'EVENT_WINNERS' || !eventTargetId) return null

  return {
    ...emptyPushForm,
    targetAudience: 'EVENT_WINNERS',
    targetType: targetType === 'NONE' || targetType === 'EXTERNAL' ? targetType : 'APP_EVENT',
    eventTargetId,
  }
}

type BuildResult = { ok: true; value: AdminNotificationPayload } | { ok: false; message: string }

/** 푸시 알림 폼 검증 + 요청 본문 변환 (검증 순서는 기존 화면과 동일) */
export function buildPushPayload(form: PushFormState): BuildResult {
  const title = form.title.trim()
  const content = form.content.trim()

  if (!title || !content) {
    return { ok: false, message: '제목과 내용을 입력해주세요.' }
  }

  if (title.length > 100 || content.length > 500) {
    return { ok: false, message: '제목은 100자, 내용은 500자 이하로 입력해주세요.' }
  }

  const isScheduled = form.sendType === 'SCHEDULED'
  const isMarketing = form.notificationType === 'MARKETING'

  if (isScheduled && !form.scheduledAt) {
    return { ok: false, message: '예약 발송 일시를 입력해주세요.' }
  }

  if (isScheduled && new Date(form.scheduledAt).getTime() <= Date.now()) {
    return { ok: false, message: '예약 발송 일시는 현재보다 미래여야 합니다.' }
  }

  if (isMarketing && isScheduled && !isMarketingPushDateTimeAllowed(form.scheduledAt)) {
    return { ok: false, message: `마케팅 푸시는 한국 시간 기준 ${MARKETING_PUSH_TIME_LABEL}에만 예약할 수 있습니다.` }
  }

  if (isMarketing && !isScheduled && !isCurrentMarketingPushTimeAllowed()) {
    return {
      ok: false,
      message: `마케팅 푸시는 한국 시간 기준 ${MARKETING_PUSH_TIME_LABEL}에만 즉시 발송할 수 있습니다. 허용 시간으로 예약해주세요.`,
    }
  }

  let eventTargetId: number | null = null
  if (form.targetType === 'APP_EVENT' || form.targetAudience === 'EVENT_WINNERS') {
    const parsedEventTargetId = Number(form.eventTargetId)
    if (!Number.isInteger(parsedEventTargetId) || parsedEventTargetId <= 0) {
      return { ok: false, message: '연결 앱 이벤트 ID는 양의 정수로 입력해주세요.' }
    }
    eventTargetId = parsedEventTargetId
  }

  const targetLink = form.targetLink.trim()
  if (targetLink.length > 1000) {
    return { ok: false, message: '외부 URL은 1,000자 이하로 입력해주세요.' }
  }
  if (form.targetType === 'EXTERNAL' && !targetLink.toLowerCase().startsWith('https://')) {
    return { ok: false, message: '외부 URL은 https://로 시작해야 합니다.' }
  }

  return {
    ok: true,
    value: {
      title,
      content,
      notificationType: form.notificationType,
      targetAudience: form.targetAudience,
      sendType: form.sendType,
      scheduledAt: isScheduled ? toLocalDateTimeString(form.scheduledAt) : null,
      targetType: form.targetType,
      eventTargetId,
      targetLink: form.targetType === 'EXTERNAL' ? targetLink : null,
    },
  }
}
