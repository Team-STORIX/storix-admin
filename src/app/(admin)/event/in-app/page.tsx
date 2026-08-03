'use client'

import { FormEvent, Fragment, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  cancelAppEvent,
  createAppEvent,
  getAppEvent,
  getAppEvents,
  updateAppEvent,
  type AppEvent,
  type AppEventPayload,
  type AppEventStatus,
  type AttendanceRewards,
  type PromotionType,
} from '@/lib/api/app-event.api'

type FormState = {
  name: string
  description: string
  startAt: string
  endAt: string
  hasWinner: boolean
  promotionTypes: PromotionType[]
  rewardRows: RewardRow[]
}

type RewardRow = {
  condition: string
  value: string
}

const emptyForm: FormState = {
  name: '',
  description: '',
  startAt: '',
  endAt: '',
  hasWinner: false,
  promotionTypes: [],
  rewardRows: [],
}

type ApiErrorBody = {
  code?: string
  message?: string
}

const promotionLabels: Record<PromotionType, string> = {
  PUSH: '푸시',
  POPUP: '팝업',
  BANNER: '배너',
}

const eventColumns = [
  { key: 'id', label: 'appEventID' },
  { key: 'name', label: '이벤트 명' },
  { key: 'period', label: '이벤트 기간' },
  { key: 'children', label: '이벤트 하위 목록' },
  { key: 'actions', label: '작업' },
] as const

const statusDesigns: Record<AppEventStatus, { label: string; className: string }> = {
  SCHEDULED: { label: '예약 대기', className: 'event-state-scheduled' },
  ACTIVE: { label: '진행 중', className: 'event-state-active' },
  ENDED: { label: '종료 완료', className: 'event-state-ended' },
  CANCELED: { label: '강제 종료', className: 'event-state-canceled' },
}

const promotionDesigns: Record<PromotionType, { label: string; className: string }> = {
  PUSH: { label: '푸시', className: 'event-type-push' },
  POPUP: { label: '팝업', className: 'event-type-popup' },
  BANNER: { label: '배너', className: 'event-type-banner' },
}

const promotionTypes: PromotionType[] = ['PUSH', 'POPUP', 'BANNER']

const emptyRewardRow = (): RewardRow => ({ condition: '', value: '' })

export default function InAppEventPage() {
  const [events, setEvents] = useState<AppEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const fetchEvents = async (page = currentPage, keyword = appliedKeyword) => {
    setLoading(true)
    setErrorMessage('')
    try {
      const response = await getAppEvents(page, keyword.trim() || undefined)
      if (response.isSuccess) {
        setEvents(response.result.content)
        setCurrentPage(response.result.page)
        setTotalPages(response.result.totalPages)
        setTotalElements(response.result.totalElements)
      }
    } catch (error) {
      const errorInfo = getApiErrorInfo(error)

      console.warn(
        `앱 이벤트 목록 조회 실패: status=${errorInfo.status ?? 'unknown'}, code=${errorInfo.code ?? 'unknown'}, message=${errorInfo.message ?? 'unknown'}, page=${page}`
      )
      console.warn('앱 이벤트 목록 조회 응답:', errorInfo.data ?? error)
      setErrorMessage(errorInfo.message ? `앱 이벤트 목록을 불러오지 못했습니다. (${errorInfo.message})` : '앱 이벤트 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchEvents(currentPage, appliedKeyword)
  }, [currentPage, appliedKeyword])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCurrentPage(0)
    setAppliedKeyword(searchQuery)
  }

  const handleSelectEvent = async (appEventId: number) => {
    if (selectedEvent?.id === appEventId) {
      setSelectedEvent(null)
      return
    }

    setDetailLoading(true)
    setErrorMessage('')
    try {
      const response = await getAppEvent(appEventId)
      if (response.isSuccess) {
        setSelectedEvent(response.result)
      }
    } catch (error) {
      const errorInfo = getApiErrorInfo(error)
      console.error('앱 이벤트 상세 조회 실패:', {
        status: errorInfo.status,
        code: errorInfo.code,
        message: errorInfo.message,
        data: errorInfo.data,
        appEventId,
        error,
      })
      setErrorMessage(errorInfo.message ? `앱 이벤트 상세를 불러오지 못했습니다. (${errorInfo.message})` : '앱 이벤트 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openCreateModal = () => {
    setForm(emptyForm)
    setModalMode('create')
  }

  const openEditModal = (event: AppEvent) => {
    setForm({
      name: event.name,
      description: event.description,
      startAt: toDatetimeLocalValue(event.startAt),
      endAt: toDatetimeLocalValue(event.endAt),
      hasWinner: event.hasWinner,
      promotionTypes: event.promotionTypes,
      rewardRows: rewardsToRows(event.attendanceRewards),
    })
    setModalMode('edit')
  }

  const closeModal = () => {
    if (saving) return
    setModalMode(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.name.trim() || !form.description.trim() || !form.startAt || !form.endAt) {
      alert('이벤트명, 설명, 시작일시, 종료일시를 모두 입력해주세요.')
      return
    }

    if (form.promotionTypes.length === 0) {
      alert('홍보 수단을 하나 이상 선택해주세요.')
      return
    }

    const attendanceRewards = parseRewardRows(form.hasWinner ? form.rewardRows : [])
    if (!attendanceRewards.ok) {
      alert(attendanceRewards.message)
      return
    }

    const payload: AppEventPayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      startAt: toLocalDateTimeString(form.startAt),
      endAt: toLocalDateTimeString(form.endAt),
      hasWinner: form.hasWinner,
      promotionTypes: form.promotionTypes,
      attendanceRewards: attendanceRewards.value,
    }

    setSaving(true)
    try {
      if (modalMode === 'edit' && selectedEvent) {
        const response = await updateAppEvent(selectedEvent.id, payload)
        if (response.isSuccess) {
          setSelectedEvent(response.result)
        }
      } else {
        const response = await createAppEvent(payload)
        if (response.isSuccess) {
          setSelectedEvent(response.result)
          setCurrentPage(0)
        }
      }

      setModalMode(null)
      setForm(emptyForm)
      await fetchEvents(modalMode === 'create' ? 0 : currentPage, appliedKeyword)
    } catch (error) {
      const errorInfo = getApiErrorInfo(error)
      console.error(modalMode === 'edit' ? '앱 이벤트 수정 실패:' : '앱 이벤트 생성 실패:', {
        status: errorInfo.status,
        code: errorInfo.code,
        message: errorInfo.message,
        data: errorInfo.data,
        payload,
        error,
      })
      alert(errorInfo.message || (modalMode === 'edit' ? '앱 이벤트 수정에 실패했습니다.' : '앱 이벤트 생성에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEvent = async (event: AppEvent) => {
    const confirmed = window.confirm(`'${event.name}' 이벤트를 강제 종료할까요?`)
    if (!confirmed) return

    try {
      const response = await cancelAppEvent(event.id)
      if (response.isSuccess) {
        setSelectedEvent(response.result)
        await fetchEvents(currentPage, appliedKeyword)
      }
    } catch (error) {
      const errorInfo = getApiErrorInfo(error)
      console.error('앱 이벤트 강제 종료 실패:', {
        status: errorInfo.status,
        code: errorInfo.code,
        message: errorInfo.message,
        data: errorInfo.data,
        appEventId: event.id,
        error,
      })
      alert(errorInfo.message || '앱 이벤트 강제 종료에 실패했습니다.')
    }
  }

  const togglePromotionType = (type: PromotionType) => {
    setForm((current) => ({
      ...current,
      promotionTypes: current.promotionTypes.includes(type)
        ? current.promotionTypes.filter((item) => item !== type)
        : [...current.promotionTypes, type],
    }))
  }

  const updateRewardRow = (
    index: number,
    field: keyof RewardRow,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      rewardRows: current.rewardRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }))
  }

  const addRewardRow = () => {
    setForm((current) => ({
      ...current,
      rewardRows: [...current.rewardRows, emptyRewardRow()],
    }))
  }

  const removeRewardRow = (index: number) => {
    setForm((current) => ({
      ...current,
      rewardRows: current.rewardRows.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null

    return (
      <div className="pagination">
        <button
          className="pagination-button"
          onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
          disabled={currentPage === 0}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>

        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            className={`pagination-button ${currentPage === index ? 'active' : ''}`}
            onClick={() => setCurrentPage(index)}
            type="button"
          >
            {index + 1}
          </button>
        ))}

        <button
          className="pagination-button"
          onClick={() => setCurrentPage((page) => Math.min(totalPages - 1, page + 1))}
          disabled={currentPage >= totalPages - 1}
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="event-page-container">
      <div className="page-head">
        <div>
          <h1>인앱 이벤트 관리</h1>
          <p className="page-sub">푸시 알림, 팝업, 배너에 연결할 앱 이벤트를 생성하고 관리합니다.</p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14" />
          </svg>
          새 이벤트 만들기
        </button>
      </div>

      <div className="toolbar">
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="이벤트명 검색"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
        <span className="filter-note">전체 {totalElements}건</span>
      </div>

      {errorMessage ? <p className="login-message">{errorMessage}</p> : null}

      <div className="event-table-panel in-app-event-panel">
        <div className="table-title-row">
          <h2>인앱 이벤트 목록</h2>
        </div>
        <table className="event-table in-app-event-table">
          <thead>
            <tr>
              {eventColumns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={eventColumns.length}>로딩 중...</td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={eventColumns.length}>등록된 앱 이벤트가 없습니다.</td>
              </tr>
            ) : (
              events.map((event) => {
                const isOpen = selectedEvent?.id === event.id

                return (
                  <Fragment key={event.id}>
                    <tr
                      key={event.id}
                      className={`event-row ${isOpen ? 'open' : ''}`}
                      onClick={() => void handleSelectEvent(event.id)}
                    >
                      <td>
                        <span className="id-chip">
                          {event.id}
                        </span>
                      </td>
                      <td>
                        <div className="event-name-cell">
                          <span className="ev-name">{event.name}</span>
                          <span className={`event-state-chip ${statusDesigns[event.status].className}`}>
                            {statusDesigns[event.status].label}
                          </span>
                        </div>
                      </td>
                      <td className="period">
                        {formatCompactDateTime(event.startAt)}
                        <span className="dash"> - </span>
                        {formatCompactDateTime(event.endAt)}
                      </td>
                      <td>
                        <div className="event-type-tags">
                          {event.promotionTypes.length > 0 ? (
                            event.promotionTypes.map((type) => (
                              <span key={type} className={`event-type-chip ${promotionDesigns[type].className}`}>
                                {promotionDesigns[type].label}
                              </span>
                            ))
                          ) : (
                            <span className="event-type-chip event-type-empty">미연결</span>
                          )}
                          {event.hasWinner ? <span className="event-type-chip event-type-winner">당첨자</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="in-app-row-actions" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                          <button className="table-action-button" onClick={() => openEditModal(event)} type="button">
                            수정
                          </button>
                          <button
                            className="table-action-button"
                            onClick={() => void handleCancelEvent(event)}
                            disabled={event.status === 'ENDED' || event.status === 'CANCELED'}
                            type="button"
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && selectedEvent ? (
                      <tr className="detail-row" key={`${event.id}-detail`}>
                        <td colSpan={eventColumns.length}>
                          <div className="report-detail-panel">
                            {detailLoading ? (
                              <div>상세 정보를 불러오는 중...</div>
                            ) : (
                              <>
                                <DetailRow label="이벤트명" value={selectedEvent.name} />
                                <DetailRow label="설명" value={selectedEvent.description} />
                                <DetailRow label="시작일시" value={formatDateTime(selectedEvent.startAt)} />
                                <DetailRow label="종료일시" value={formatDateTime(selectedEvent.endAt)} />
                                <DetailRow label="보상 설정" value={formatAttendanceRewards(selectedEvent.attendanceRewards)} />
                                <DetailRow label="생성일시" value={formatDateTime(selectedEvent.createdAt)} />
                                <DetailRow label="수정일시" value={formatDateTime(selectedEvent.updatedAt)} />
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}

      {modalMode ? (
        <div className="modal-overlay" onClick={closeModal}>
          <form className="modal-container" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>{modalMode === 'edit' ? '앱 이벤트 수정' : '새 앱 이벤트 만들기'}</h2>
              <p>앱 이벤트 기본 정보와 연결할 홍보 수단을 입력합니다.</p>
            </div>

            <div className="modal-body">
              <label className="field">
                <span>이벤트명</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>설명</span>
                <input
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>시작 일시</span>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>종료 일시</span>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))}
                />
              </label>

              <div className="promotion-selector" aria-label="홍보 수단 선택">
                <span>홍보 수단</span>
                {promotionTypes.map((type) => (
                  <label key={type}>
                    <input
                      type="checkbox"
                      checked={form.promotionTypes.includes(type)}
                      onChange={() => togglePromotionType(type)}
                    />
                    {promotionLabels[type]}
                  </label>
                ))}
              </div>

              <label className="action-checkbox">
                <input
                  type="checkbox"
                  checked={form.hasWinner}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      hasWinner: event.target.checked,
                      rewardRows:
                        event.target.checked && current.rewardRows.length === 0
                          ? [emptyRewardRow()]
                          : current.rewardRows,
                    }))
                  }
                />
                <div className="checkbox-content">
                  <div className="checkbox-title">당첨자 안내 있음</div>
                  <div className="checkbox-desc">이벤트 종료 후 당첨자 안내가 필요한 이벤트입니다.</div>
                </div>
              </label>

              {form.hasWinner ? (
                <div className="field wide">
                  <span>이벤트 보상 설정</span>
                  <div className="reward-row-list">
                    {form.rewardRows.map((row, index) => (
                      <div className="reward-row" key={index}>
                        <input
                          inputMode="numeric"
                          placeholder="조건"
                          value={row.condition}
                          onChange={(event) => updateRewardRow(index, 'condition', event.target.value)}
                        />
                        <input
                          inputMode="numeric"
                          placeholder="보상값"
                          value={row.value}
                          onChange={(event) => updateRewardRow(index, 'value', event.target.value)}
                        />
                        <button
                          className="table-action-button"
                          onClick={() => removeRewardRow(index)}
                          type="button"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                  <button className="table-action-button" onClick={addRewardRow} type="button">
                    보상 추가
                  </button>
                </div>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeModal} disabled={saving} type="button">
                취소
              </button>
              <button className="btn-modal-confirm" disabled={saving} type="submit">
                {saving ? '저장 중...' : modalMode === 'edit' ? '수정 완료' : '이벤트 생성'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="report-detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}

function formatDateTime(value: string) {
  return formatDateMinute(value)
}

function formatCompactDateTime(value: string) {
  return formatDateMinute(value)
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function toLocalDateTimeString(value: string) {
  return value.replace('T', ' ')
}

function formatAttendanceRewards(rewards?: AttendanceRewards | null) {
  const entries = Object.entries(rewards ?? {})
  if (entries.length === 0) return '-'

  return entries
    .map(([condition, value]) => `조건 ${condition}: 보상 ${value}`)
    .join(', ')
}

function rewardsToRows(rewards?: AttendanceRewards | null): RewardRow[] {
  const rows = Object.entries(rewards ?? {}).map(([condition, value]) => ({
    condition,
    value: String(value),
  }))

  return rows.length > 0 ? rows : []
}

function parseRewardRows(rows: RewardRow[]):
  | { ok: true; value: AttendanceRewards }
  | { ok: false; message: string } {
  const rewards: AttendanceRewards = {}

  for (const row of rows) {
    const condition = row.condition.trim()
    const valueText = row.value.trim()

    if (!condition && !valueText) continue

    if (!condition || !valueText) {
      return { ok: false, message: '보상 조건과 보상값을 모두 입력해주세요.' }
    }

    if (!/^\d+$/.test(condition)) {
      return { ok: false, message: '보상 조건은 숫자로 입력해주세요.' }
    }

    const value = Number(valueText)
    if (!Number.isFinite(value)) {
      return { ok: false, message: '보상값은 숫자로 입력해주세요.' }
    }

    rewards[condition] = value
  }

  return { ok: true, value: rewards }
}

function formatDateMinute(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function getApiErrorInfo(error: unknown) {
  const axiosError = error as AxiosError<ApiErrorBody>

  return {
    status: axiosError.response?.status,
    code: axiosError.response?.data?.code,
    message: axiosError.response?.data?.message,
    data: axiosError.response?.data,
  }
}
