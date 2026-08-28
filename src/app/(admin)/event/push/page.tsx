'use client'

import { FormEvent, Fragment, useEffect, useMemo, useState } from 'react'
import {
  broadcastAdminNotification,
  cancelAdminNotification,
  createAdminNotification,
  getAdminNotification,
  getAdminNotifications,
  updateAdminNotification,
  type AdminNotification,
  type AdminNotificationListItem,
  type AdminNotificationPayload,
  type NotificationStatus,
  type NotificationTargetType,
  type NotificationType,
  type SendType,
  type TargetAudience,
} from '@/lib/api/notification.api'
import { formatDateTime } from '@/lib/utils/date-format'

type FormState = {
  title: string
  content: string
  notificationType: NotificationType
  targetAudience: TargetAudience
  sendType: SendType
  scheduledAt: string
  targetType: NotificationTargetType
  eventTargetId: string
  targetLink: string
}

const emptyForm: FormState = {
  title: '',
  content: '',
  notificationType: 'MARKETING',
  targetAudience: 'ALL',
  sendType: 'IMMEDIATE',
  scheduledAt: '',
  targetType: 'APP_EVENT',
  eventTargetId: '',
  targetLink: '',
}

const notificationTypeLabels: Record<NotificationType, string> = {
  MARKETING: '마케팅',
  FEATURE_UPDATE: '신기능',
  TOS_UPDATE: '약관 변경',
  PRIVACY_UPDATE: '개인정보 처리방침',
}

const targetAudienceLabels: Record<TargetAudience, string> = {
  ALL: '전체 유저',
  NEW_USERS: '신규 유저',
  EVENT_WINNERS: '이벤트 당첨자',
}

const sendTypeLabels: Record<SendType, string> = {
  IMMEDIATE: '즉시 발송',
  SCHEDULED: '예약 발송',
}

const targetTypeLabels: Record<NotificationTargetType, string> = {
  NONE: '없음',
  APP_EVENT: '앱 이벤트',
  EXTERNAL: '외부 URL',
}

const statusLabels: Record<NotificationStatus, string> = {
  SCHEDULED: '예약됨',
  SENDING: '발송 중',
  SENT: '발송완료',
  FAILED: '실패',
  CANCELED: '취소됨',
}

const statusClasses: Record<NotificationStatus, string> = {
  SCHEDULED: 'event-state-scheduled',
  SENDING: 'event-state-active',
  SENT: 'event-state-active',
  FAILED: 'event-state-canceled',
  CANCELED: 'event-state-ended',
}

export default function PushNotificationPage() {
  const [notifications, setNotifications] = useState<AdminNotificationListItem[]>([])
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const filteredNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          !searchQuery ||
          notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(notification.id).includes(searchQuery),
      ),
    [notifications, searchQuery],
  )

  const fetchNotifications = async (page = currentPage) => {
    setLoading(true)
    setErrorMessage('')
    try {
      const response = await getAdminNotifications(page)
      if (response.isSuccess) {
        setNotifications(response.result.content)
        setCurrentPage(response.result.page)
        setTotalPages(response.result.totalPages)
        setTotalElements(response.result.totalElements)
      }
    } catch {
      setErrorMessage('푸시 알림 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchNotifications(currentPage)
  }, [currentPage])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const eventTargetId = params.get('eventTargetId')
    const targetAudience = params.get('targetAudience')
    const targetType = params.get('targetType')

    if (targetAudience !== 'EVENT_WINNERS' || !eventTargetId) return

    setForm({
      ...emptyForm,
      targetAudience: 'EVENT_WINNERS',
      targetType: targetType === 'NONE' || targetType === 'EXTERNAL' ? targetType : 'APP_EVENT',
      eventTargetId,
    })
    setModalMode('create')
  }, [])

  const handleSelectNotification = async (adminNotificationId: number) => {
    if (selectedNotification?.id === adminNotificationId) {
      setSelectedNotification(null)
      return
    }

    setDetailLoading(true)
    setErrorMessage('')
    try {
      const response = await getAdminNotification(adminNotificationId)
      if (response.isSuccess) {
        setSelectedNotification(response.result)
      }
    } catch {
      setErrorMessage('푸시 알림 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openCreateModal = () => {
    setForm(emptyForm)
    setModalMode('create')
  }

  const closeModal = () => {
    if (saving) return
    setModalMode(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.title.trim() || !form.content.trim()) {
      alert('제목과 내용을 입력해주세요.')
      return
    }

    if (form.title.trim().length > 100 || form.content.trim().length > 500) {
      alert('제목은 100자, 내용은 500자 이하로 입력해주세요.')
      return
    }

    if (form.sendType === 'SCHEDULED' && !form.scheduledAt) {
      alert('예약 발송 일시를 입력해주세요.')
      return
    }

    if (form.sendType === 'SCHEDULED' && new Date(form.scheduledAt).getTime() <= Date.now()) {
      alert('예약 발송 일시는 현재보다 미래여야 합니다.')
      return
    }

    let eventTargetId: number | null = null
    if (form.targetType === 'APP_EVENT' || form.targetAudience === 'EVENT_WINNERS') {
      const parsedEventTargetId = Number(form.eventTargetId)
      if (!Number.isInteger(parsedEventTargetId) || parsedEventTargetId <= 0) {
        alert('연결 앱 이벤트 ID는 양의 정수로 입력해주세요.')
        return
      }
      eventTargetId = parsedEventTargetId
    }

    const targetLink = form.targetLink.trim()
    if (targetLink.length > 1000) {
      alert('외부 URL은 1,000자 이하로 입력해주세요.')
      return
    }
    if (form.targetType === 'EXTERNAL' && !targetLink.toLowerCase().startsWith('https://')) {
      alert('외부 URL은 https://로 시작해야 합니다.')
      return
    }

    const payload: AdminNotificationPayload = {
      title: form.title.trim(),
      content: form.content.trim(),
      notificationType: form.notificationType,
      targetAudience: form.targetAudience,
      sendType: form.sendType,
      scheduledAt: form.sendType === 'SCHEDULED' ? formatScheduledAt(form.scheduledAt) : null,
      targetType: form.targetType,
      eventTargetId,
      targetLink: form.targetType === 'EXTERNAL' ? targetLink : null,
    }

    setSaving(true)
    try {
      if (modalMode === 'edit' && selectedNotification) {
        const response = await updateAdminNotification(selectedNotification.id, payload)
        if (response.isSuccess) {
          setSelectedNotification(response.result)
        }
      } else {
        const response = await createAdminNotification(payload)
        if (response.isSuccess) {
          const detail = await getAdminNotification(response.result)
          if (detail.isSuccess) {
            setSelectedNotification(detail.result)
          }
          setCurrentPage(0)
        }
      }

      setModalMode(null)
      setForm(emptyForm)
      await fetchNotifications(modalMode === 'create' ? 0 : currentPage)
    } catch {
      alert(modalMode === 'edit' ? '푸시 알림 수정에 실패했습니다.' : '푸시 알림 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleBroadcast = async (notification: AdminNotificationListItem) => {
    const confirmed = window.confirm(`'${notification.title}' 알림을 실패 대상에게 재발송할까요?`)
    if (!confirmed) return

    try {
      const response = await broadcastAdminNotification(notification.id)
      if (response.isSuccess) {
        alert('재발송 요청이 완료되었습니다.')
        await fetchNotifications(currentPage)
      }
    } catch {
      alert('푸시 알림 재발송에 실패했습니다.')
    }
  }

  const handleCancel = async (notification: AdminNotificationListItem) => {
    const confirmed = window.confirm(`'${notification.title}' 예약을 취소할까요?`)
    if (!confirmed) return

    try {
      const response = await cancelAdminNotification(notification.id)
      if (response.isSuccess) {
        setSelectedNotification(response.result)
        await fetchNotifications(currentPage)
      }
    } catch {
      alert('푸시 알림 예약 취소에 실패했습니다.')
    }
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
          <h1>푸시 알림 관리</h1>
          <p className="page-sub">
            운영자 알림을 생성하고 즉시 발송 또는 예약 발송 상태를 관리합니다.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14" />
          </svg>
          새 알림 만들기
        </button>
      </div>

      <div className="toolbar">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="알림 제목 · ID 검색"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <span className="filter-note">전체 {searchQuery ? filteredNotifications.length : totalElements}건</span>
      </div>

      {errorMessage ? <p className="login-message">{errorMessage}</p> : null}

      <div className="event-table-panel">
        <table className="event-table">
          <thead>
            <tr>
              <th>알림 ID</th>
              <th>제목</th>
              <th>유형</th>
              <th>대상</th>
              <th>발송 방식</th>
              <th>발송 일시</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>로딩 중...</td>
              </tr>
            ) : filteredNotifications.length === 0 ? (
              <tr>
                <td colSpan={8}>등록된 푸시 알림이 없습니다.</td>
              </tr>
            ) : (
              filteredNotifications.map((notification) => {
                const isOpen = selectedNotification?.id === notification.id

                return (
                  <Fragment key={notification.id}>
                    <tr
                      className={`event-row ${isOpen ? 'open' : ''}`}
                      onClick={() => void handleSelectNotification(notification.id)}
                    >
                      <td>
                        <span className="id-chip">
                          <span className="dot"></span>
                          {notification.id}
                        </span>
                      </td>
                      <td>
                        <div className="ev-name">{notification.title}</div>
                      </td>
                      <td>{notificationTypeLabels[notification.notificationType] ?? notification.notificationType}</td>
                      <td>{targetAudienceLabels[notification.targetAudience] ?? notification.targetAudience}</td>
                      <td>{sendTypeLabels[notification.sendType] ?? notification.sendType}</td>
                      <td className="period">
                        {notification.scheduledAt ? formatDateTime(notification.scheduledAt) : '즉시'}
                      </td>
                      <td>
                        <span className={`event-state-chip ${statusClasses[notification.status]}`}>
                          {statusLabels[notification.status] ?? notification.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                          {notification.status === 'SCHEDULED' ? (
                            <button
                              className="btn-cancel"
                              onClick={() => void handleCancel(notification)}
                              type="button"
                            >
                              취소
                            </button>
                          ) : null}
                          {notification.status === 'FAILED' ? (
                            <button
                              className="btn-edit"
                              onClick={() => void handleBroadcast(notification)}
                              type="button"
                            >
                              재발송
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                    {isOpen && selectedNotification ? (
                      <tr className="detail-row">
                        <td colSpan={8}>
                          <div className="report-detail-panel">
                            {detailLoading ? (
                              <div>상세 정보를 불러오는 중...</div>
                            ) : (
                              <>
                                <DetailRow label="제목" value={selectedNotification.title} />
                                <DetailRow label="내용" value={selectedNotification.content} />
                                <DetailRow label="알림 유형" value={notificationTypeLabels[selectedNotification.notificationType] ?? selectedNotification.notificationType} />
                                <DetailRow label="발송 대상" value={targetAudienceLabels[selectedNotification.targetAudience] ?? selectedNotification.targetAudience} />
                                <DetailRow label="발송 방식" value={sendTypeLabels[selectedNotification.sendType] ?? selectedNotification.sendType} />
                                <DetailRow label="예약 일시" value={selectedNotification.scheduledAt ? formatDateTime(selectedNotification.scheduledAt) : '즉시'} />
                                <DetailRow label="타겟 유형" value={targetTypeLabels[selectedNotification.targetType] ?? selectedNotification.targetType} />
                                <DetailRow label="이벤트 타겟 ID" value={selectedNotification.eventTargetId ? String(selectedNotification.eventTargetId) : '-'} />
                                <DetailRow label="외부 URL" value={selectedNotification.targetLink || '-'} />
                                <DetailRow label="생성일시" value={formatDateTime(selectedNotification.createdAt)} />
                                <DetailRow label="수정일시" value={formatDateTime(selectedNotification.updatedAt)} />
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
              <h2>{modalMode === 'edit' ? '푸시 알림 수정' : '새 알림 만들기'}</h2>
              <p>알림 내용과 발송 방식, 이동 타겟을 입력합니다.</p>
            </div>

            <div className="modal-body">
              <label className="field">
                <span>알림 제목</span>
                <input
                  placeholder="푸시 알림 제목 입력"
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>알림 내용</span>
                <textarea
                  placeholder="푸시 알림 세부 설명"
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                />
              </label>
              <div className="field choice-field">
                <span>알림 유형</span>
                <div className="choice-group">
                  {(Object.keys(notificationTypeLabels) as NotificationType[]).map((notificationType) => (
                    <button
                      key={notificationType}
                      className={`choice-button ${form.notificationType === notificationType ? 'selected' : ''}`}
                      onClick={() => setForm((current) => ({ ...current, notificationType }))}
                      type="button"
                    >
                      {notificationTypeLabels[notificationType]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                <span>이동 대상</span>
                <select
                  value={form.targetType}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      targetType: event.target.value as NotificationTargetType,
                      eventTargetId:
                        event.target.value === 'APP_EVENT' || current.targetAudience === 'EVENT_WINNERS'
                          ? current.eventTargetId
                          : '',
                      targetLink: event.target.value === 'EXTERNAL' ? current.targetLink : '',
                    }))
                  }
                >
                  <option value="APP_EVENT">앱 이벤트</option>
                  <option value="EXTERNAL">외부 URL</option>
                  <option value="NONE">없음</option>
                </select>
              </label>
              {form.targetType === 'APP_EVENT' ? (
                <>
                  <label className="field">
                    <span>연결 앱 이벤트 ID</span>
                    <input
                      inputMode="numeric"
                      value={form.eventTargetId}
                      onChange={(event) => setForm((current) => ({ ...current, eventTargetId: event.target.value }))}
                      placeholder="appEventId 입력"
                    />
                  </label>
                </>
              ) : null}
              {form.targetType === 'EXTERNAL' ? (
                <label className="field">
                  <span>외부 URL</span>
                  <input
                    type="url"
                    value={form.targetLink}
                    onChange={(event) => setForm((current) => ({ ...current, targetLink: event.target.value }))}
                    placeholder="https://..."
                  />
                </label>
              ) : null}
              <div className="field choice-field">
                <span>발송 대상</span>
                <div className="choice-group">
                  {(Object.keys(targetAudienceLabels) as TargetAudience[]).map((targetAudience) => (
                    <button
                      key={targetAudience}
                      className={`choice-button ${form.targetAudience === targetAudience ? 'selected' : ''}`}
                      onClick={() => setForm((current) => ({ ...current, targetAudience }))}
                      type="button"
                    >
                      {targetAudienceLabels[targetAudience]}
                    </button>
                  ))}
                </div>
              </div>
              {form.targetAudience === 'EVENT_WINNERS' && form.targetType !== 'APP_EVENT' ? (
                <label className="field">
                  <span>당첨자 대상 이벤트 ID</span>
                  <input
                    inputMode="numeric"
                    value={form.eventTargetId}
                    onChange={(event) => setForm((current) => ({ ...current, eventTargetId: event.target.value }))}
                    placeholder="appEventId 입력"
                  />
                </label>
              ) : null}
              <div className="field choice-field">
                <span>발송 방식</span>
                <div className="choice-group">
                  {(Object.keys(sendTypeLabels) as SendType[]).map((sendType) => (
                    <button
                      key={sendType}
                      className={`choice-button ${form.sendType === sendType ? 'selected' : ''}`}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          sendType,
                          scheduledAt: sendType === 'IMMEDIATE' ? '' : current.scheduledAt,
                        }))
                      }
                      type="button"
                    >
                      {sendTypeLabels[sendType]}
                    </button>
                  ))}
                </div>
              </div>
              {form.sendType === 'SCHEDULED' ? (
                <label className="field">
                  <span>예약 발송 일시</span>
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
                  />
                </label>
              ) : null}
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeModal} disabled={saving} type="button">
                취소
              </button>
              <button className="btn-modal-confirm" disabled={saving} type="submit">
                {saving ? '저장 중...' : modalMode === 'edit' ? '수정 완료' : '알림 생성'}
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

function formatScheduledAt(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
