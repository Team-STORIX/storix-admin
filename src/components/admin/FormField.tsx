import type { ChangeEvent, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

type FieldProps = {
  label: ReactNode
  className?: string
  children: ReactNode
}

/** `label.field > span + control` 공통 레이아웃 */
export function Field({ label, className, children }: FieldProps) {
  return (
    <label className={className ? `field ${className}` : 'field'}>
      <span>{label}</span>
      {children}
    </label>
  )
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: ReactNode
  value: string
  onChange: (value: string) => void
}

export function TextField({ label, value, onChange, ...inputProps }: TextFieldProps) {
  return (
    <Field label={label}>
      <input value={value} onChange={(event) => onChange(event.target.value)} {...inputProps} />
    </Field>
  )
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label: ReactNode
  value: string
  onChange: (value: string) => void
}

export function TextAreaField({ label, value, onChange, ...textareaProps }: TextAreaFieldProps) {
  return (
    <Field label={label}>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} {...textareaProps} />
    </Field>
  )
}

type SelectFieldProps<T extends string> = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> & {
  label: ReactNode
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}

export function SelectField<T extends string>({ label, value, onChange, options, ...selectProps }: SelectFieldProps<T>) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChange(event.target.value as T)} {...selectProps}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  )
}

type ChoiceFieldProps<T extends string> = {
  label: ReactNode
  value: T
  onChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
}

/** 버튼 그룹 단일 선택 (푸시 알림 유형/대상/발송 방식) */
export function ChoiceField<T extends string>({ label, value, onChange, options }: ChoiceFieldProps<T>) {
  return (
    <div className="field choice-field">
      <span>{label}</span>
      <div className="choice-group">
        {options.map((option) => (
          <button
            key={option.value}
            className={`choice-button ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** `Record<Key, label>` 를 select/choice 옵션 배열로 변환 */
export function labelsToOptions<T extends string>(labels: Record<T, string>): Array<{ value: T; label: string }> {
  return (Object.keys(labels) as T[]).map((value) => ({ value, label: labels[value] }))
}
