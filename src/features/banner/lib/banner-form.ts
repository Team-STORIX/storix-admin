import type { AdminBanner, AdminBannerPayload, BannerContentTargetType, BannerStatus } from '@/lib/api/banner.api'
import { toDatetimeLocalValue, toLocalDateTimeString } from '@/lib/utils/date-format'

export const bannerStatusLabels: Record<BannerStatus, string> = {
  SCHEDULED: '예약됨',
  ACTIVE: '노출중',
  ENDED: '종료됨',
  CANCELED: '종료됨',
}

export const bannerStatusClasses: Record<BannerStatus, string> = {
  SCHEDULED: 'event-state-scheduled',
  ACTIVE: 'event-state-active',
  ENDED: 'event-state-canceled',
  CANCELED: 'event-state-canceled',
}

export const bannerTargetTypeLabels: Record<BannerContentTargetType, string> = {
  APP_EVENT: '전체 유저',
}

export const bannerColumnCount = 6

export type BannerFormState = {
  targetId: string
  contentTargetType: BannerContentTargetType
  bannerTitle: string
  displayStartAt: string
  displayEndAt: string
  file: File | null
}

export const emptyBannerForm: BannerFormState = {
  targetId: '',
  contentTargetType: 'APP_EVENT',
  bannerTitle: '',
  displayStartAt: '',
  displayEndAt: '',
  file: null,
}

export function toBannerFormState(banner: AdminBanner): BannerFormState {
  return {
    targetId: String(banner.targetId),
    contentTargetType: banner.contentTargetType,
    bannerTitle: banner.bannerTitle,
    displayStartAt: toDatetimeLocalValue(banner.displayStartAt),
    displayEndAt: toDatetimeLocalValue(banner.displayEndAt),
    file: null,
  }
}

type BuildResult =
  | { ok: true; value: { payload: AdminBannerPayload; file: File | null } }
  | { ok: false; message: string }

/** 배너 폼 검증 + 요청 본문 변환. 생성 모드에서는 이미지가 필수다. */
export function buildBannerPayload(form: BannerFormState, mode: 'create' | 'edit'): BuildResult {
  const bannerTitle = form.bannerTitle.trim()

  if (!form.targetId.trim() || !bannerTitle || !form.displayStartAt || !form.displayEndAt) {
    return { ok: false, message: '타겟 ID, 배너명, 노출 기간을 모두 입력해주세요.' }
  }

  if (bannerTitle.length > 100) {
    return { ok: false, message: '배너명은 100자 이하로 입력해주세요.' }
  }

  const targetId = Number(form.targetId)
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, message: '연결 앱 이벤트 ID는 양의 정수로 입력해주세요.' }
  }

  if (mode === 'create' && !form.file) {
    return { ok: false, message: '배너 이미지를 선택해주세요.' }
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
        bannerTitle,
        displayStartAt: toLocalDateTimeString(form.displayStartAt),
        displayEndAt: toLocalDateTimeString(form.displayEndAt),
      },
      file: form.file,
    },
  }
}
