import type {
  AppEvent,
  AppEventPayload,
  AppEventType,
  AttendanceRewards,
  PromotionType,
} from '@/lib/api/app-event.api'
import { toDatetimeLocalValue, toLocalDateTimeString } from '@/lib/utils/date-format'
import { DEFAULT_ATTENDANCE_REWARD_LABEL, eventTypeLabels } from './app-event-labels'

export type RewardRow = {
  condition: string
  value: string
}

export type AppEventFormState = {
  name: string
  description: string
  eventType: AppEventType
  pageKey: string
  startAt: string
  endAt: string
  hasWinner: boolean
  promotionTypes: PromotionType[]
  rewardRows: RewardRow[]
}

export const emptyAppEventForm: AppEventFormState = {
  name: '',
  description: '',
  eventType: 'ATTENDANCE',
  pageKey: '',
  startAt: '',
  endAt: '',
  hasWinner: false,
  promotionTypes: [],
  rewardRows: [],
}

export const emptyRewardRow = (): RewardRow => ({ condition: '', value: '' })

/** 서버 이벤트를 수정 폼 상태로 변환 */
export function toAppEventFormState(event: AppEvent): AppEventFormState {
  return {
    name: event.name,
    description: event.description,
    eventType: event.eventType,
    pageKey: event.pageKey ?? '',
    startAt: toDatetimeLocalValue(event.startAt),
    endAt: toDatetimeLocalValue(event.endAt),
    hasWinner: event.hasWinner,
    promotionTypes: event.promotionTypes,
    rewardRows: rewardsToRows(event.attendanceRewards),
  }
}

export function rewardsToRows(rewards?: AttendanceRewards | null): RewardRow[] {
  return Object.entries(rewards ?? {}).map(([condition, value]) => ({
    condition,
    value: String(value),
  }))
}

export function formatAttendanceRewards(rewards: AttendanceRewards | null | undefined, eventType: AppEventType) {
  const entries = Object.entries(rewards ?? {})
  if (entries.length === 0) {
    return eventType === 'ATTENDANCE' ? DEFAULT_ATTENDANCE_REWARD_LABEL : '-'
  }

  return entries.map(([condition, value]) => `조건 ${condition}: 보상 ${value}`).join(', ')
}

/**
 * 이벤트 유형별 시작·종료 시각 경계.
 * 출석 체크는 00:00, 스토리 카드는 06:00이어야 하고, 일반 이벤트는 제한이 없다.
 * (STORIX-FE-2.1 / LANDING 의 일자 경계 계산과 동일한 기준)
 */
export function getEventBoundaryHour(eventType: AppEventType): number | null {
  if (eventType === 'ATTENDANCE') return 0
  if (eventType === 'STORY_CARD') return 6
  return null
}

export const formatBoundaryHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

function hasBoundaryHour(dateTimeLocal: string, boundaryHour: number) {
  return dateTimeLocal.split('T')[1] === formatBoundaryHour(boundaryHour)
}

function isCompleteLocalDateTime(value: string) {
  return /^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)
}

const PAGE_KEY_PATTERN = /^[a-z0-9-]{1,50}$/

type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string }

export function parseRewardRows(rows: RewardRow[]): ParseResult<AttendanceRewards> {
  const rewards: AttendanceRewards = {}

  for (const row of rows) {
    const condition = row.condition.trim()
    const valueText = row.value.trim()

    if (!condition && !valueText) continue

    if (!condition || !valueText) {
      return { ok: false, message: '보상 조건과 보상값을 모두 입력해주세요.' }
    }

    if (!/^\d+$/.test(condition) || Number(condition) < 1) {
      return { ok: false, message: '보상 조건은 1 이상의 출석일로 입력해주세요.' }
    }

    if (!/^\d+$/.test(valueText)) {
      return { ok: false, message: '보상값은 0 이상의 정수로 입력해주세요.' }
    }

    if (Object.hasOwn(rewards, condition)) {
      return { ok: false, message: '동일한 출석일 보상 조건을 중복해서 입력할 수 없습니다.' }
    }

    rewards[condition] = Number(valueText)
  }

  const sortedEntries = Object.entries(rewards).sort(([left], [right]) => Number(left) - Number(right))
  for (let index = 1; index < sortedEntries.length; index += 1) {
    if (sortedEntries[index][1] < sortedEntries[index - 1][1]) {
      return { ok: false, message: '출석일이 늘어날수록 누적 응모권 수가 줄어들 수 없습니다.' }
    }
  }

  return { ok: true, value: rewards }
}

/**
 * 폼 검증 후 서버 요청 본문을 만든다.
 * 실패 시 사용자에게 보여줄 메시지를 돌려준다. (검증 순서는 기존 화면과 동일)
 */
export function buildAppEventPayload(form: AppEventFormState): ParseResult<AppEventPayload> {
  const name = form.name.trim()
  const description = form.description.trim()

  if (!name || !description || !form.eventType || !form.startAt || !form.endAt) {
    return { ok: false, message: '이벤트명, 설명, 이벤트 유형, 시작일시, 종료일시를 모두 입력해주세요.' }
  }

  if (!isCompleteLocalDateTime(form.startAt) || !isCompleteLocalDateTime(form.endAt)) {
    return { ok: false, message: '시작일시와 종료일시의 날짜, 시, 분을 올바르게 입력해주세요.' }
  }

  if (name.length > 100 || description.length > 500) {
    return { ok: false, message: '이벤트명은 100자, 설명은 500자 이하로 입력해주세요.' }
  }

  const pageKey = form.pageKey.trim()
  if (pageKey && !PAGE_KEY_PATTERN.test(pageKey)) {
    return { ok: false, message: '페이지 키는 영소문자, 숫자, 하이픈만 사용해 50자 이하로 입력해주세요.' }
  }

  if (form.startAt >= form.endAt) {
    return { ok: false, message: '종료 일시는 시작 일시 이후여야 합니다.' }
  }

  const boundaryHour = getEventBoundaryHour(form.eventType)
  if (
    boundaryHour !== null &&
    (!hasBoundaryHour(form.startAt, boundaryHour) || !hasBoundaryHour(form.endAt, boundaryHour))
  ) {
    return {
      ok: false,
      message: `${eventTypeLabels[form.eventType]} 이벤트의 시작·종료 시각은 ${formatBoundaryHour(boundaryHour)}이어야 합니다.`,
    }
  }

  if (form.promotionTypes.length === 0) {
    return { ok: false, message: '홍보 수단을 하나 이상 선택해주세요.' }
  }

  const attendanceRewards = parseRewardRows(form.hasWinner ? form.rewardRows : [])
  if (!attendanceRewards.ok) {
    return attendanceRewards
  }

  return {
    ok: true,
    value: {
      name,
      description,
      eventType: form.eventType,
      pageKey: pageKey || null,
      startAt: toLocalDateTimeString(form.startAt),
      endAt: toLocalDateTimeString(form.endAt),
      hasWinner: form.hasWinner,
      promotionTypes: form.promotionTypes,
      attendanceRewards: attendanceRewards.value,
    },
  }
}

/** 당첨자 추첨 인원 입력값 검증 (1 ~ 1,000 정수) */
export function parseWinnerCount(value: string): number | null {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 1000 ? parsed : null
}
