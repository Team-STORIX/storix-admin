import type { AdminPopup, AdminPopupPayload, PopupContentTargetType, PopupExposurePolicy, PopupStatus } from '@/lib/api/popup.api'
import { toDatetimeLocalValue, toLocalDateTimeString } from '@/lib/utils/date-format'

export const popupStatusLabels: Record<PopupStatus, string> = {
  SCHEDULED: '예약됨',
  ACTIVE: '노출중',
  ENDED: '종료됨',
  CANCELED: '강제 종료',
}

export const popupStatusClasses: Record<PopupStatus, string> = {
  SCHEDULED: 'event-state-scheduled',
  ACTIVE: 'event-state-active',
  ENDED: 'event-state-ended',
  CANCELED: 'event-state-canceled',
}

export const popupTargetTypeLabels: Record<PopupContentTargetType, string> = {
  APP_EVENT: '앱 이벤트',
}

export const popupExposurePolicyLabels: Record<PopupExposurePolicy, string> = {
  ALWAYS_DURING_PERIOD: '기간 내 항상 노출',
  ONCE_PER_DAY: '하루 한 번 노출',
}

export const popupColumnCount = 7

export type PopupFormState = {
  targetId: string
  contentTargetType: PopupContentTargetType
  exposurePolicy: PopupExposurePolicy
  popupTitle: string
  content: string
  ctaText: string
  displayStartAt: string
  displayEndAt: string
  file: File | null
}

export const emptyPopupForm: PopupFormState = {
  targetId: '',
  contentTargetType: 'APP_EVENT',
  exposurePolicy: 'ALWAYS_DURING_PERIOD',
  popupTitle: '',
  content: '',
  ctaText: '',
  displayStartAt: '',
  displayEndAt: '',
  file: null,
}

export function toPopupFormState(popup: AdminPopup): PopupFormState {
  return {
    targetId: String(popup.targetId),
    contentTargetType: popup.contentTargetType,
    exposurePolicy: popup.exposurePolicy,
    popupTitle: popup.popupTitle,
    content: popup.content,
    ctaText: popup.ctaText,
    displayStartAt: toDatetimeLocalValue(popup.displayStartAt),
    displayEndAt: toDatetimeLocalValue(popup.displayEndAt),
    file: null,
  }
}

type BuildResult =
  | { ok: true; value: { payload: AdminPopupPayload; file: File | null } }
  | { ok: false; message: string }

/** 팝업 폼 검증 + 요청 본문 변환. 생성 모드에서는 이미지가 필수다. */
export function buildPopupPayload(form: PopupFormState, mode: 'create' | 'edit'): BuildResult {
  const popupTitle = form.popupTitle.trim()
  const content = form.content.trim()
  const ctaText = form.ctaText.trim()

  if (!form.targetId.trim() || !popupTitle || !content || !ctaText || !form.displayStartAt || !form.displayEndAt) {
    return { ok: false, message: '연결 앱 이벤트 ID, 제목, 내용, CTA, 노출 기간을 모두 입력해주세요.' }
  }

  if (popupTitle.length > 100 || content.length > 500 || ctaText.length > 40) {
    return { ok: false, message: '팝업 제목은 100자, 내용은 500자, CTA는 40자 이하로 입력해주세요.' }
  }

  const targetId = Number(form.targetId)
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, message: '연결 앱 이벤트 ID는 양의 정수로 입력해주세요.' }
  }

  if (mode === 'create' && !form.file) {
    return { ok: false, message: '팝업 이미지를 선택해주세요.' }
  }
  if (form.displayStartAt >= form.displayEndAt) {
    return { ok: false, message: '노출 종료 일시는 시작 일시 이후여야 합니다.' }
  }

  return {
    ok: true,
    value: {
      payload: {
        appEventId: targetId,
        contentTargetType: form.contentTargetType,
        exposurePolicy: form.exposurePolicy,
        popupTitle,
        content,
        ctaText,
        displayStartAt: toLocalDateTimeString(form.displayStartAt),
        displayEndAt: toLocalDateTimeString(form.displayEndAt),
      },
      file: form.file,
    },
  }
}

/** ID 문자열로 썸네일 플레이스홀더 그라데이션을 고른다. */
export function thumbColor(id: string) {
  const colors = [
    ['#EC1E79', '#B60E5A'],
    ['#3457C4', '#22368A'],
    ['#0E9F6E', '#0A7A54'],
  ]
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const [from, to] = colors[hash % colors.length]
  return `linear-gradient(135deg,${from},${to})`
}
