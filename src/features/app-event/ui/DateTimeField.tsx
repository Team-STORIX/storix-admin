type DateTimePart = 'date' | 'hour' | 'minute'

/** `YYYY-MM-DDTHH:mm` 문자열의 일부(날짜/시/분)만 교체한다. */
function updateDateTimePart(value: string, part: DateTimePart, nextValue: string) {
  const [currentDate = '', currentTime = ''] = value.split('T')
  const [currentHour = '00', currentMinute = '00'] = currentTime.split(':')

  if (part === 'date') {
    return nextValue ? `${nextValue}T${currentHour || '00'}:${currentMinute || '00'}` : ''
  }

  if (!currentDate) return value
  if (part === 'hour') return `${currentDate}T${nextValue}:${currentMinute || '00'}`
  return `${currentDate}T${currentHour || '00'}:${nextValue}`
}

/** 비어 있으면 00, 범위를 벗어나면 0~max 로 보정해 두 자리로 맞춘다. */
function normalizeTimePart(value: string, max: number) {
  if (!value.trim()) return '00'
  return String(Math.min(Math.max(Number(value), 0), max)).padStart(2, '0')
}

type DateTimeFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

/** 날짜 + 시/분 숫자 입력으로 구성된 일시 필드 (datetime-local 값 형식 유지) */
export function DateTimeField({ label, value, onChange }: DateTimeFieldProps) {
  const [date = '', time = ''] = value.split('T')
  const [hour = '', minute = ''] = time.split(':')

  const timeInput = (part: 'hour' | 'minute', partValue: string, max: number) => (
    <input
      type="number"
      inputMode="numeric"
      min="0"
      max={max}
      value={partValue}
      disabled={!date}
      aria-label={`${label} ${part === 'hour' ? '시' : '분'}`}
      onChange={(event) => onChange(updateDateTimePart(value, part, event.target.value))}
      onBlur={(event) => onChange(updateDateTimePart(value, part, normalizeTimePart(event.target.value, max)))}
    />
  )

  return (
    <div className="field date-time-field">
      <span>{label}</span>
      <div className="date-time-input-row">
        <input
          className="date-input"
          type="date"
          value={date}
          aria-label={`${label} 날짜`}
          onChange={(event) => onChange(updateDateTimePart(value, 'date', event.target.value))}
        />
        <div className="time-number-inputs">
          {timeInput('hour', hour, 23)}
          <span>시</span>
          {timeInput('minute', minute, 59)}
          <span>분</span>
        </div>
      </div>
    </div>
  )
}
