'use client'

import { FormEvent, Fragment, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  cancelAppEvent,
  createAppEvent,
  drawAppEventWinners,
  getAppEvent,
  getAppEvents,
  getAttendanceEventWinners,
  updateAppEvent,
  type AppEvent,
  type AppEventPayload,
  type AppEventStatus,
  type AppEventType,
  type AppEventWinnerDrawResult,
  type AttendanceEventWinnerResult,
  type AttendanceRewards,
  type PromotionType,
} from '@/lib/api/app-event.api'
import {
  formatDateTime,
  toDatetimeLocalValue,
  toLocalDateTimeString,
} from '@/lib/utils/date-format'

type FormState = {
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

type RewardRow = {
  condition: string
  value: string
}

const emptyForm: FormState = {
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

type ApiErrorBody = {
  code?: string
  message?: string
}

const promotionLabels: Record<PromotionType, string> = {
  PUSH: '푸시',
  POPUP: '팝업',
  BANNER: '배너',
}

const eventTypeLabels: Record<AppEventType, string> = {
  GENERAL: '일반',
  ATTENDANCE: '출석 체크',
  STORY_CARD: '오늘의 스토리 카드',
}

const eventTypes: AppEventType[] = ['ATTENDANCE', 'STORY_CARD', 'GENERAL']

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
  const [drawingWinners, setDrawingWinners] = useState(false)
  const [loadingAttendanceWinners, setLoadingAttendanceWinners] = useState(false)
  const [winnerCount, setWinnerCount] = useState('')
  const [winnerDrawResult, setWinnerDrawResult] = useState<AppEventWinnerDrawResult | null>(null)
  const [attendanceWinnerResult, setAttendanceWinnerResult] = useState<AttendanceEventWinnerResult | null>(null)
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
      setWinnerCount('')
      setWinnerDrawResult(null)
      setAttendanceWinnerResult(null)
      return
    }

    setDetailLoading(true)
    setWinnerCount('')
    setWinnerDrawResult(null)
    setAttendanceWinnerResult(null)
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
      eventType: event.eventType,
      pageKey: event.pageKey ?? '',
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

    if (!form.name.trim() || !form.description.trim() || !form.eventType || !form.startAt || !form.endAt) {
      alert('이벤트명, 설명, 이벤트 유형, 시작일시, 종료일시를 모두 입력해주세요.')
      return
    }

    if (form.name.trim().length > 100 || form.description.trim().length > 500) {
      alert('이벤트명은 100자, 설명은 500자 이하로 입력해주세요.')
      return
    }

    const pageKey = form.pageKey.trim()
    if (pageKey && !/^[a-z0-9-]{1,50}$/.test(pageKey)) {
      alert('페이지 키는 영소문자, 숫자, 하이픈만 사용해 50자 이하로 입력해주세요.')
      return
    }

    if (form.startAt >= form.endAt) {
      alert('종료 일시는 시작 일시 이후여야 합니다.')
      return
    }

    const boundaryHour = getEventBoundaryHour(form.eventType)
    if (boundaryHour !== null && (!hasBoundaryHour(form.startAt, boundaryHour) || !hasBoundaryHour(form.endAt, boundaryHour))) {
      alert(`${eventTypeLabels[form.eventType]} 이벤트의 시작·종료 시각은 ${String(boundaryHour).padStart(2, '0')}:00이어야 합니다.`)
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
      eventType: form.eventType,
      pageKey: pageKey || null,
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

  const handleDrawWinners = async (event: AppEvent) => {
    const parsedWinnerCount = Number(winnerCount)
    if (!Number.isInteger(parsedWinnerCount) || parsedWinnerCount < 1 || parsedWinnerCount > 1000) {
      alert('추첨 인원은 1명 이상 1,000명 이하의 정수로 입력해주세요.')
      return
    }

    const confirmed = window.confirm(
      `'${event.name}' 이벤트의 당첨자 ${parsedWinnerCount}명을 확정할까요?\n확정 후에는 이후 참여자가 반영되지 않으며 재추첨할 수 없습니다.`,
    )
    if (!confirmed) return

    setDrawingWinners(true)
    try {
      const response = await drawAppEventWinners(event.id, parsedWinnerCount)
      if (response.isSuccess) {
        setWinnerDrawResult(response.result)
        if (event.eventType === 'ATTENDANCE') {
          await loadAttendanceWinners(event.id, false)
        }
        alert(
          response.result.alreadyFinalized
            ? '이미 확정된 당첨자 결과를 불러왔습니다.'
            : `${response.result.winners.length}명의 당첨자를 확정했습니다.`,
        )
      }
    } catch (error) {
      const errorInfo = getApiErrorInfo(error)
      alert(errorInfo.message || '당첨자 확정에 실패했습니다.')
    } finally {
      setDrawingWinners(false)
    }
  }

  const loadAttendanceWinners = async (appEventId: number, showFailureAlert = true) => {
    setLoadingAttendanceWinners(true)
    try {
      const response = await getAttendanceEventWinners(appEventId)
      if (response.isSuccess) {
        setAttendanceWinnerResult(response.result)
      }
    } catch (error) {
      const errorInfo = getApiErrorInfo(error)
      console.error('출석 이벤트 당첨자 조회 실패:', {
        status: errorInfo.status,
        code: errorInfo.code,
        message: errorInfo.message,
        data: errorInfo.data,
        appEventId,
        error,
      })
      if (showFailureAlert) {
        alert(errorInfo.message || '출석 이벤트 당첨자 조회에 실패했습니다.')
      }
    } finally {
      setLoadingAttendanceWinners(false)
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
                          <span className="dot"></span>
                          {event.id}
                        </span>
                      </td>
                      <td>
                        <div className="event-name-cell">
                          <span className="ev-name">{event.name}</span>
                          <span className="event-type-chip event-type-empty">
                            {formatEventType(event.eventType)}
                          </span>
                          <span className={`event-state-chip ${statusDesigns[event.status].className}`}>
                            {statusDesigns[event.status].label}
                          </span>
                        </div>
                      </td>
                      <td className="period">
                        {formatDateTime(event.startAt)}
                        <span className="dash"> ~ </span>
                        {formatDateTime(event.endAt)}
                      </td>
                      <td>
                        <div className="event-type-tags">
                          {promotionTypes.map((type) => {
                            const isConnected = event.promotionTypes.includes(type)

                            return (
                              <span
                                key={type}
                                className={`event-type-chip ${
                                  isConnected ? promotionDesigns[type].className : 'event-type-empty event-type-disabled'
                                }`}
                              >
                                {promotionDesigns[type].label}
                              </span>
                            )
                          })}
                          <span className={`event-type-chip ${event.hasWinner ? 'event-type-winner' : 'event-type-empty event-type-disabled'}`}>
                            당첨자
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="in-app-row-actions" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                          <button className="btn-edit" onClick={() => openEditModal(event)} type="button">
                            수정
                          </button>
                          <button
                            className="btn-cancel"
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
                                <DetailRow label="이벤트 유형" value={formatEventType(selectedEvent.eventType)} />
                                <DetailRow label="페이지 키" value={selectedEvent.pageKey || '유형별 기본 화면'} />
                                <DetailRow label="시작일시" value={formatDateTime(selectedEvent.startAt)} />
                                <DetailRow label="종료일시" value={formatDateTime(selectedEvent.endAt)} />
                                <DetailRow
                                  label="보상 설정"
                                  value={formatAttendanceRewards(selectedEvent.attendanceRewards, selectedEvent.eventType)}
                                />
                                <DetailRow label="생성일시" value={formatDateTime(selectedEvent.createdAt)} />
                                <DetailRow label="수정일시" value={formatDateTime(selectedEvent.updatedAt)} />
                                {selectedEvent.hasWinner ? (
                                  <div className="winner-draw-card">
                                    <div className="winner-draw-head">
                                      <div>
                                        <strong>당첨자 추첨</strong>
                                        <p>
                                          이벤트가 종료된 뒤 최초 1회만 확정됩니다. 이미 확정된 이벤트는 재추첨하지 않고 기존 당첨자를 불러옵니다.
                                        </p>
                                      </div>
                                      <span className={`event-state-chip ${selectedEvent.status === 'ENDED' || selectedEvent.status === 'CANCELED' ? 'event-state-ended' : 'event-state-scheduled'}`}>
                                        {selectedEvent.status === 'ENDED' || selectedEvent.status === 'CANCELED' ? '추첨 가능' : '종료 필요'}
                                      </span>
                                    </div>
                                    <div className="winner-draw-actions">
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        max="1000"
                                        placeholder="당첨자 수"
                                        value={winnerCount}
                                        onChange={(event) => setWinnerCount(event.target.value)}
                                        disabled={drawingWinners || loadingAttendanceWinners}
                                      />
                                      <button
                                        className="table-action-button winner-primary-button"
                                        disabled={drawingWinners || loadingAttendanceWinners}
                                        onClick={() => void handleDrawWinners(selectedEvent)}
                                        type="button"
                                      >
                                        {drawingWinners ? '추첨 중...' : '당첨자 확정하기'}
                                      </button>
                                      {selectedEvent.eventType === 'ATTENDANCE' ? (
                                        <button
                                          className="table-action-button"
                                          disabled={drawingWinners || loadingAttendanceWinners}
                                          onClick={() => void loadAttendanceWinners(selectedEvent.id)}
                                          type="button"
                                        >
                                          {loadingAttendanceWinners ? '조회 중...' : '출석 응모권/결과 조회'}
                                        </button>
                                      ) : null}
                                      <a
                                        className={`table-action-button winner-push-link ${winnerDrawResult || attendanceWinnerResult ? '' : 'disabled'}`}
                                        href={`/event/push?targetAudience=EVENT_WINNERS&targetType=APP_EVENT&eventTargetId=${selectedEvent.id}`}
                                        aria-disabled={!(winnerDrawResult || attendanceWinnerResult)}
                                        onClick={(event) => {
                                          if (!(winnerDrawResult || attendanceWinnerResult)) event.preventDefault()
                                        }}
                                      >
                                        당첨자 푸시 만들기
                                      </a>
                                    </div>
                                    <p className="winner-draw-note">
                                      확정된 당첨자는 푸시 알림 관리에서 발송 대상 “이벤트 당첨자”와 이 appEventID를 선택하면 해당 이벤트 당첨자에게만 발송됩니다.
                                    </p>
                                    {attendanceWinnerResult?.appEventId === selectedEvent.id ? (
                                      <div className="winner-result-list">
                                        <div className="winner-result-summary">
                                          후보자 {attendanceWinnerResult.candidateCount}명 · 총 응모권 {attendanceWinnerResult.totalTickets}장 · 확정 당첨자 {attendanceWinnerResult.winners.length}명
                                        </div>
                                        {attendanceWinnerResult.winners.length > 0 ? (
                                          attendanceWinnerResult.winners.map((winner) => (
                                            <div className="winner-result-row" key={winner.userId}>
                                              <span>{winner.drawOrder}위</span>
                                              <strong>{winner.nickName || '탈퇴 사용자'}</strong>
                                              <small>User ID {winner.userId} · 응모권 {winner.ticketCount}장 · 출석 {winner.totalAttendedDays}일</small>
                                            </div>
                                          ))
                                        ) : (
                                          <div className="winner-empty">아직 확정된 당첨자가 없습니다.</div>
                                        )}
                                      </div>
                                    ) : winnerDrawResult ? (
                                      <div className="winner-result-list">
                                        <div className="winner-result-summary">
                                          {winnerDrawResult.alreadyFinalized ? '기존 확정 결과' : '새 확정 결과'} · 총 {winnerDrawResult.winners.length}명
                                        </div>
                                        {winnerDrawResult.winners.map((winner) => (
                                          <div className="winner-result-row" key={winner.userId}>
                                            <span>{winner.drawOrder}위</span>
                                            <strong>{winner.nickName || '탈퇴 사용자'}</strong>
                                            <small>User ID {winner.userId}</small>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  <div className="winner-draw-card muted">
                                    <strong>당첨자 추첨 없음</strong>
                                    <p>이 이벤트는 hasWinner=false라 당첨자 확정 API를 호출하지 않습니다.</p>
                                  </div>
                                )}
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
                <span>이벤트 유형</span>
                <select
                  value={form.eventType}
                  onChange={(event) => setForm((current) => ({
                    ...current,
                    eventType: event.target.value as AppEventType,
                  }))}
                >
                  {eventTypes.map((eventType) => (
                    <option key={eventType} value={eventType}>{eventTypeLabels[eventType]}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>페이지 키 (선택)</span>
                <input
                  value={form.pageKey}
                  maxLength={50}
                  pattern="[a-z0-9-]*"
                  placeholder="예: attendance-2026-08-17"
                  onChange={(event) => setForm((current) => ({ ...current, pageKey: event.target.value }))}
                />
              </label>
              <p className="filter-note">
                비워두면 이벤트 유형의 기본 화면을 사용합니다. 영소문자·숫자·하이픈만 입력할 수 있습니다.
              </p>
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
              {getEventBoundaryHour(form.eventType) !== null ? (
                <p className="filter-note">
                  {eventTypeLabels[form.eventType]} 이벤트는 시작·종료 시각을 {String(getEventBoundaryHour(form.eventType)).padStart(2, '0')}:00으로 입력해야 합니다. 종료 시각은 마지막 참여일 다음 경계입니다.
                </p>
              ) : null}

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
                  {form.eventType === 'ATTENDANCE' ? (
                    <p className="filter-note">비워두면 기본 지급표(3일 1개, 7일 2개, 12일 5개)가 적용됩니다.</p>
                  ) : null}
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

function formatAttendanceRewards(rewards: AttendanceRewards | null | undefined, eventType: AppEventType) {
  const entries = Object.entries(rewards ?? {})
  if (entries.length === 0) {
    return eventType === 'ATTENDANCE' ? '기본 지급표 (3일 1개, 7일 2개, 12일 5개)' : '-'
  }

  return entries
    .map(([condition, value]) => `조건 ${condition}: 보상 ${value}`)
    .join(', ')
}

function formatEventType(eventType: AppEventType) {
  return eventTypeLabels[eventType]
}

function getEventBoundaryHour(eventType: AppEventType) {
  if (eventType === 'ATTENDANCE') return 0
  if (eventType === 'STORY_CARD') return 6
  return null
}

function hasBoundaryHour(dateTimeLocal: string, boundaryHour: number) {
  const time = dateTimeLocal.split('T')[1]
  return time === `${String(boundaryHour).padStart(2, '0')}:00`
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

    if (!/^\d+$/.test(condition) || Number(condition) < 1) {
      return { ok: false, message: '보상 조건은 1 이상의 출석일로 입력해주세요.' }
    }

    if (!/^\d+$/.test(valueText)) {
      return { ok: false, message: '보상값은 0 이상의 정수로 입력해주세요.' }
    }

    if (Object.hasOwn(rewards, condition)) {
      return { ok: false, message: '동일한 출석일 보상 조건을 중복해서 입력할 수 없습니다.' }
    }

    const value = Number(valueText)

    rewards[condition] = value
  }

  const sortedEntries = Object.entries(rewards).sort(([left], [right]) => Number(left) - Number(right))
  for (let index = 1; index < sortedEntries.length; index += 1) {
    if (sortedEntries[index][1] < sortedEntries[index - 1][1]) {
      return { ok: false, message: '출석일이 늘어날수록 누적 응모권 수가 줄어들 수 없습니다.' }
    }
  }

  return { ok: true, value: rewards }
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
