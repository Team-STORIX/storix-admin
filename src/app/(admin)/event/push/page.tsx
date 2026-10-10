'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  broadcastAdminNotification,
  cancelAdminNotification,
  createAdminNotification,
  getAdminNotification,
  getAdminNotifications,
  type AdminNotification,
  type AdminNotificationListItem,
  type AdminNotificationPayload,
} from '@/lib/api/notification.api'
import { getApiErrorMessage } from '@/lib/api/errors'
import { usePagedList } from '@/lib/hooks/usePagedList'
import { formatDateTime } from '@/lib/utils/date-format'
import { CreateButton, PageHeader } from '@/components/admin/PageHeader'
import { ListToolbar } from '@/components/admin/SearchBox'
import { Pagination } from '@/components/admin/Pagination'
import { DetailRow } from '@/components/admin/DetailRow'
import { DetailPanelRow, IdChip, RowActions, StatusChip, TableMessageRow } from '@/components/admin/Table'
import {
  getWinnerPushPrefill,
  notificationStatusClasses,
  notificationStatusLabels,
  notificationTargetTypeLabels,
  notificationTypeLabels,
  pushColumnCount,
  sendTypeLabels,
  targetAudienceLabels,
  type PushFormState,
} from '@/features/push/lib/push-form'
import { PushFormModal } from '@/features/push/ui/PushFormModal'

type ModalState = { initialForm?: PushFormState } | null

const formatScheduledAt = (scheduledAt: string | null) => (scheduledAt ? formatDateTime(scheduledAt) : '즉시')

export default function PushNotificationPage() {
  const list = usePagedList<AdminNotificationListItem>({
    fetchPage: (page) => getAdminNotifications(page),
    getLoadErrorMessage: () => '푸시 알림 목록을 불러오지 못했습니다.',
  })
  const [selectedNotification, setSelectedNotification] = useState<AdminNotification | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  // 검색은 서버 조회 없이 현재 페이지 안에서 제목/ID로 필터링한다.
  const { searchQuery } = list
  const filteredNotifications = useMemo(
    () =>
      list.items.filter(
        (notification) =>
          !searchQuery ||
          notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          String(notification.id).includes(searchQuery),
      ),
    [list.items, searchQuery],
  )

  useEffect(() => {
    const prefill = getWinnerPushPrefill(window.location.search)
    if (prefill) setModal({ initialForm: prefill })
  }, [])

  const handleSelectNotification = async (adminNotificationId: number) => {
    if (selectedNotification?.id === adminNotificationId) {
      setSelectedNotification(null)
      return
    }

    setDetailLoading(true)
    list.setErrorMessage('')
    try {
      const response = await getAdminNotification(adminNotificationId)
      if (response.isSuccess) {
        setSelectedNotification(response.result)
      }
    } catch {
      list.setErrorMessage('푸시 알림 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
  }

  const handleSubmit = async (payload: AdminNotificationPayload) => {
    setSaving(true)
    try {
      const response = await createAdminNotification(payload)
      if (response.isSuccess) {
        const detail = await getAdminNotification(response.result)
        if (detail.isSuccess) {
          setSelectedNotification(detail.result)
        }
      }

      setModal(null)
      list.reload(0)
    } catch (error) {
      alert(getApiErrorMessage(error, '푸시 알림 생성에 실패했습니다.'))
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
        list.reload()
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
        list.reload()
      }
    } catch {
      alert('푸시 알림 예약 취소에 실패했습니다.')
    }
  }

  return (
    <div className="event-page-container">
      <PageHeader
        title="푸시 알림 관리"
        description="운영자 알림을 생성하고 즉시 발송 또는 예약 발송 상태를 관리합니다."
        action={<CreateButton label="새 알림 만들기" onClick={() => setModal({})} />}
      />

      <ListToolbar
        search={{
          value: list.searchQuery,
          onChange: list.setSearchQuery,
          placeholder: '알림 제목 · ID 검색',
        }}
        totalCount={searchQuery ? filteredNotifications.length : list.totalElements}
      />

      {list.errorMessage ? <p className="login-message">{list.errorMessage}</p> : null}

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
            {list.loading ? (
              <TableMessageRow colSpan={pushColumnCount}>로딩 중...</TableMessageRow>
            ) : filteredNotifications.length === 0 ? (
              <TableMessageRow colSpan={pushColumnCount}>등록된 푸시 알림이 없습니다.</TableMessageRow>
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
                        <IdChip value={notification.id} />
                      </td>
                      <td>
                        <div className="ev-name">{notification.title}</div>
                      </td>
                      <td>{notificationTypeLabels[notification.notificationType] ?? notification.notificationType}</td>
                      <td>{targetAudienceLabels[notification.targetAudience] ?? notification.targetAudience}</td>
                      <td>{sendTypeLabels[notification.sendType] ?? notification.sendType}</td>
                      <td className="period">{formatScheduledAt(notification.scheduledAt)}</td>
                      <td>
                        <StatusChip
                          className={notificationStatusClasses[notification.status]}
                          label={notificationStatusLabels[notification.status] ?? notification.status}
                        />
                      </td>
                      <td>
                        <RowActions>
                          {notification.status === 'SCHEDULED' ? (
                            <button className="btn-cancel" onClick={() => void handleCancel(notification)} type="button">
                              취소
                            </button>
                          ) : null}
                          {notification.status === 'FAILED' ? (
                            <button className="btn-edit" onClick={() => void handleBroadcast(notification)} type="button">
                              재발송
                            </button>
                          ) : null}
                        </RowActions>
                      </td>
                    </tr>
                    {isOpen && selectedNotification ? (
                      <DetailPanelRow colSpan={pushColumnCount} loading={detailLoading}>
                        <DetailRow label="제목" value={selectedNotification.title} />
                        <DetailRow label="내용" value={selectedNotification.content} />
                        <DetailRow label="알림 유형" value={notificationTypeLabels[selectedNotification.notificationType] ?? selectedNotification.notificationType} />
                        <DetailRow label="발송 대상" value={targetAudienceLabels[selectedNotification.targetAudience] ?? selectedNotification.targetAudience} />
                        <DetailRow label="발송 방식" value={sendTypeLabels[selectedNotification.sendType] ?? selectedNotification.sendType} />
                        <DetailRow label="예약 일시" value={formatScheduledAt(selectedNotification.scheduledAt)} />
                        <DetailRow label="타겟 유형" value={notificationTargetTypeLabels[selectedNotification.targetType] ?? selectedNotification.targetType} />
                        <DetailRow label="이벤트 타겟 ID" value={selectedNotification.eventTargetId ? String(selectedNotification.eventTargetId) : '-'} />
                        <DetailRow label="외부 URL" value={selectedNotification.targetLink || '-'} />
                        <DetailRow label="생성일시" value={formatDateTime(selectedNotification.createdAt)} />
                        <DetailRow label="수정일시" value={formatDateTime(selectedNotification.updatedAt)} />
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
        <PushFormModal initialForm={modal.initialForm} saving={saving} onClose={closeModal} onSubmit={handleSubmit} />
      ) : null}
    </div>
  )
}
