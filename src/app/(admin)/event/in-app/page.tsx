'use client'

import { Fragment, useState } from 'react'
import {
  cancelAppEvent,
  createAppEvent,
  getAppEvent,
  getAppEvents,
  updateAppEvent,
  type AppEvent,
  type AppEventPayload,
} from '@/lib/api/app-event.api'
import { formatLoadErrorMessage, getApiErrorInfo, getApiErrorMessage, logApiError } from '@/lib/api/errors'
import { usePagedList } from '@/lib/hooks/usePagedList'
import { formatDateTime } from '@/lib/utils/date-format'
import { MARKETING_PUSH_TIME_LABEL } from '@/lib/utils/notification-rules'
import { CreateButton, PageHeader } from '@/components/admin/PageHeader'
import { ListToolbar } from '@/components/admin/SearchBox'
import { Pagination } from '@/components/admin/Pagination'
import { DetailPanelRow, IdChip, isClosedStatus, RowActions, StatusChip, TableMessageRow } from '@/components/admin/Table'
import { eventColumns, eventTypeLabels, promotionDesigns, promotionTypes, statusDesigns } from '@/features/app-event/lib/app-event-labels'
import { AppEventDetail } from '@/features/app-event/ui/AppEventDetail'
import { AppEventFormModal } from '@/features/app-event/ui/AppEventFormModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; event: AppEvent } | null

export default function InAppEventPage() {
  const list = usePagedList<AppEvent>({
    fetchPage: getAppEvents,
    getLoadErrorMessage: (error) => formatLoadErrorMessage('앱 이벤트 목록을 불러오지 못했습니다.', error),
    onLoadError: (error, page) => {
      const errorInfo = getApiErrorInfo(error)
      console.warn(
        `앱 이벤트 목록 조회 실패: status=${errorInfo.status ?? 'unknown'}, code=${errorInfo.code ?? 'unknown'}, message=${errorInfo.message ?? 'unknown'}, page=${page}`,
      )
      console.warn('앱 이벤트 목록 조회 응답:', errorInfo.data ?? error)
    },
  })
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const handleSelectEvent = async (appEventId: number) => {
    if (selectedEvent?.id === appEventId) {
      setSelectedEvent(null)
      return
    }

    setDetailLoading(true)
    list.setErrorMessage('')
    try {
      const response = await getAppEvent(appEventId)
      if (response.isSuccess) {
        setSelectedEvent(response.result)
      }
    } catch (error) {
      logApiError('앱 이벤트 상세 조회 실패:', error, { appEventId })
      list.setErrorMessage(formatLoadErrorMessage('앱 이벤트 상세를 불러오지 못했습니다.', error))
    } finally {
      setDetailLoading(false)
    }
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
  }

  const handleSubmit = async (payload: AppEventPayload) => {
    if (!modal) return
    const isEdit = modal.mode === 'edit'

    setSaving(true)
    try {
      const response = isEdit ? await updateAppEvent(modal.event.id, payload) : await createAppEvent(payload)
      if (response.isSuccess) {
        setSelectedEvent(response.result)
      }

      setModal(null)
      list.reload(isEdit ? undefined : 0)
    } catch (error) {
      logApiError(isEdit ? '앱 이벤트 수정 실패:' : '앱 이벤트 생성 실패:', error, { payload })
      alert(getApiErrorMessage(error, isEdit ? '앱 이벤트 수정에 실패했습니다.' : '앱 이벤트 생성에 실패했습니다.'))
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
        list.reload()
      }
    } catch (error) {
      logApiError('앱 이벤트 강제 종료 실패:', error, { appEventId: event.id })
      alert(getApiErrorMessage(error, '앱 이벤트 강제 종료에 실패했습니다.'))
    }
  }

  return (
    <div className="event-page-container">
      <PageHeader
        title="인앱 이벤트 관리"
        description="푸시 알림, 팝업, 배너에 연결할 앱 이벤트를 생성하고 관리합니다."
        action={<CreateButton label="새 이벤트 만들기" onClick={() => setModal({ mode: 'create' })} />}
      />

      <div className="event-workflow-notice" role="note">
        <span className="event-workflow-notice-icon" aria-hidden="true">i</span>
        <div>
          <strong>인앱 이벤트를 먼저 생성해주세요.</strong>
          <p>이벤트 생성 후 푸시 알림, 팝업(모달), 배너 관리에서 해당 appEventID를 연결해 홍보 콘텐츠를 만들 수 있습니다.</p>
          <p>마케팅 푸시는 한국 시간 기준 {MARKETING_PUSH_TIME_LABEL}에만 발송할 수 있습니다.</p>
        </div>
      </div>

      <ListToolbar
        search={{
          value: list.searchQuery,
          onChange: list.setSearchQuery,
          placeholder: '이벤트명 검색',
          onSubmit: list.submitSearch,
        }}
        totalCount={list.totalElements}
      />

      {list.errorMessage ? <p className="login-message">{list.errorMessage}</p> : null}

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
            {list.loading ? (
              <TableMessageRow colSpan={eventColumns.length}>로딩 중...</TableMessageRow>
            ) : list.items.length === 0 ? (
              <TableMessageRow colSpan={eventColumns.length}>등록된 앱 이벤트가 없습니다.</TableMessageRow>
            ) : (
              list.items.map((event) => {
                const isOpen = selectedEvent?.id === event.id

                return (
                  <Fragment key={event.id}>
                    <tr
                      className={`event-row ${isOpen ? 'open' : ''}`}
                      onClick={() => void handleSelectEvent(event.id)}
                    >
                      <td>
                        <IdChip value={event.id} />
                      </td>
                      <td>
                        <div className="event-name-cell">
                          <span className="ev-name">{event.name}</span>
                          <span className="event-type-chip event-type-empty">{eventTypeLabels[event.eventType]}</span>
                          <StatusChip
                            className={statusDesigns[event.status].className}
                            label={statusDesigns[event.status].label}
                          />
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
                        <RowActions className="in-app-row-actions">
                          <button className="btn-edit" onClick={() => setModal({ mode: 'edit', event })} type="button">
                            수정
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={() => void handleCancelEvent(event)}
                            disabled={isClosedStatus(event.status)}
                            type="button"
                          >
                            취소
                          </button>
                        </RowActions>
                      </td>
                    </tr>
                    {isOpen && selectedEvent ? (
                      <DetailPanelRow colSpan={eventColumns.length} loading={detailLoading}>
                        <AppEventDetail event={selectedEvent} />
                      </DetailPanelRow>
                    ) : null}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={list.currentPage} totalPages={list.totalPages} onChange={list.goToPage} />

      {modal ? (
        <AppEventFormModal
          editingEvent={modal.mode === 'edit' ? modal.event : null}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}
