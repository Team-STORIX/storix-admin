'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import type { ApiEnvelope, PageResult } from '../api/types'

type UsePagedListOptions<T> = {
  /** 페이지/검색어로 목록을 조회한다. keyword는 trim 된 값이거나 undefined. */
  fetchPage: (page: number, keyword?: string) => Promise<ApiEnvelope<PageResult<T>>>
  /** 조회 실패 시 화면에 표시할 메시지 */
  getLoadErrorMessage: (error: unknown) => string
  /** 조회 실패 시 추가 로깅 등 */
  onLoadError?: (error: unknown, page: number) => void
}

/**
 * 관리자 목록 화면 공통 상태.
 * 페이지 이동 / 검색어 적용 / 재조회(reload)를 한 곳에서 관리하고,
 * 실제 요청은 의존성이 바뀔 때 effect에서 한 번만 수행한다.
 */
export function usePagedList<T>({ fetchPage, getLoadErrorMessage, onLoadError }: UsePagedListOptions<T>) {
  const [items, setItems] = useState<T[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      setLoading(true)
      setErrorMessage('')
      try {
        const response = await fetchPage(currentPage, appliedKeyword.trim() || undefined)
        if (ignore) return
        if (response.isSuccess) {
          setItems(response.result.content)
          setCurrentPage(response.result.page)
          setTotalPages(response.result.totalPages)
          setTotalElements(response.result.totalElements)
        }
      } catch (error) {
        if (ignore) return
        onLoadError?.(error, currentPage)
        setErrorMessage(getLoadErrorMessage(error))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void load()

    return () => {
      ignore = true
    }
    // fetchPage / 콜백은 호출부에서 모듈 스코프 함수를 넘기므로 의존성에서 제외한다.
  }, [currentPage, appliedKeyword, reloadKey])

  const submitSearch = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault()
      setCurrentPage(0)
      setAppliedKeyword(searchQuery)
    },
    [searchQuery],
  )

  /** 지정한 페이지(기본: 현재 페이지)를 다시 조회한다. */
  const reload = useCallback((page?: number) => {
    if (page !== undefined) setCurrentPage(page)
    setReloadKey((key) => key + 1)
  }, [])

  return {
    items,
    currentPage,
    totalPages,
    totalElements,
    loading,
    errorMessage,
    setErrorMessage,
    searchQuery,
    setSearchQuery,
    submitSearch,
    goToPage: setCurrentPage,
    reload,
  }
}
