const pad2 = (value: number) => String(value).padStart(2, '0')

/**
 * 날짜/시간을 YYYY.MM.DD HH:mm 형식으로 포맷
 */
export function formatDateTime(value: string): string {
  const date = new Date(value.replace(' ', 'T'))
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/**
 * 날짜 범위를 포맷
 */
export function formatDateRange(start: string, end: string): string {
  return `${formatDateTime(start)} ~ ${formatDateTime(end)}`
}

/**
 * 날짜/시간을 YYYY-MM-DD · HH:mm 형식으로 포맷 (유저 관리 콘텐츠 미리보기)
 */
export function formatDateTimeWithDot(value: string): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} · ${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

/**
 * 날짜만 YYYY-MM-DD(UTC 기준)로 포맷
 */
export function formatIsoDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
}

/**
 * 브라우저 로캘(ko-KR) 기준 날짜/시간 문자열
 */
export function formatLocaleDateTime(value: string): string {
  return new Date(value).toLocaleString('ko-KR')
}

/**
 * datetime-local input 값을 LocalDateTime 문자열로 변환 (YYYY-MM-DD HH:mm)
 */
export function toLocalDateTimeString(value: string): string {
  return value.replace('T', ' ')
}

/**
 * LocalDateTime 문자열을 datetime-local input 값으로 변환
 */
export function toDatetimeLocalValue(value: string): string {
  return value.replace(' ', 'T').slice(0, 16)
}
