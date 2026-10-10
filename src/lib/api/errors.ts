import { isAxiosError } from 'axios'

export type ApiErrorBody = {
  code?: string
  message?: string
  fieldErrors?: unknown
}

export type ApiErrorInfo = {
  status?: number
  code?: string
  message?: string
  fieldErrors?: unknown
  data?: ApiErrorBody
}

/** Axios 에러에서 서버 응답 정보를 안전하게 추출한다. */
export function getApiErrorInfo(error: unknown): ApiErrorInfo {
  if (!isAxiosError<ApiErrorBody>(error)) return {}

  const data = error.response?.data
  return {
    status: error.response?.status,
    code: data?.code,
    message: data?.message,
    fieldErrors: data?.fieldErrors,
    data,
  }
}

/**
 * 사용자에게 보여줄 에러 메시지.
 * 서버 메시지 > (서버 응답이 없는 일반 Error의 message) > fallback 순으로 사용한다.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const { message } = getApiErrorInfo(error)
  if (message) return message
  if (!isAxiosError(error) && error instanceof Error && error.message) return error.message
  return fallback
}

/** 목록 조회 실패 메시지: 서버 메시지가 있으면 괄호로 덧붙인다. */
export function formatLoadErrorMessage(base: string, error: unknown): string {
  const { message } = getApiErrorInfo(error)
  return message ? `${base} (${message})` : base
}

/** 개발자 콘솔용 에러 로깅. 서버 응답 정보와 호출 컨텍스트를 함께 남긴다. */
export function logApiError(label: string, error: unknown, context?: Record<string, unknown>) {
  console.error(label, { ...getApiErrorInfo(error), ...context, error })
}
