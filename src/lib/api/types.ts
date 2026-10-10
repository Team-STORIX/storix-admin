/**
 * 백엔드 공통 응답 래퍼.
 * STORIX-FE-2.1의 `lib/api/types.ts` `ApiResponse<T>`와 동일한 형태를 유지한다.
 */
export type ApiEnvelope<T> = {
  isSuccess: boolean
  code: string
  message: string
  result: T
  timestamp: string
}

/** 관리자 목록 API 공통 페이지 응답 */
export type PageResult<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
  hasPrevious?: boolean
}

/** 페이지 조회 공통 쿼리 파라미터 */
export type PageQuery = {
  page?: number
  size?: number
  sort?: string[]
}
