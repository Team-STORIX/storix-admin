export const MARKETING_PUSH_START_HOUR = 8
export const MARKETING_PUSH_END_HOUR = 21
export const MARKETING_PUSH_TIME_LABEL = '08:00~20:59'

export function isMarketingPushDateTimeAllowed(value: string) {
  const hour = Number(value.split('T')[1]?.split(':')[0])
  return Number.isInteger(hour) && isMarketingPushHourAllowed(hour)
}

export function isCurrentMarketingPushTimeAllowed(date = new Date()) {
  const hourPart = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    hourCycle: 'h23',
  })
    .formatToParts(date)
    .find((part) => part.type === 'hour')

  return isMarketingPushHourAllowed(Number(hourPart?.value))
}

function isMarketingPushHourAllowed(hour: number) {
  return hour >= MARKETING_PUSH_START_HOUR && hour < MARKETING_PUSH_END_HOUR
}
