/**
 * 날짜/시간을 YYYY.MM.DD HH:mm 형식으로 포맷
 */
export function formatDateTime(value: string): string {
  const normalizedValue = value.replace(' ', 'T')
  const date = new Date(normalizedValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}.${month}.${day} ${hours}:${minutes}`
}

/**
 * 날짜 범위를 포맷
 */
export function formatDateRange(start: string, end: string): string {
  return `${formatDateTime(start)} ~ ${formatDateTime(end)}`
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
