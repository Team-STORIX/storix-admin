'use client'

import { Fragment, useState } from 'react'
import {
  cancelAdminPopup,
  createAdminPopup,
  getAdminPopup,
  getAdminPopups,
  updateAdminPopup,
  type AdminPopup,
  type AdminPopupPayload,
} from '@/lib/api/popup.api'
import { getApiErrorInfo, getApiErrorMessage, logApiError } from '@/lib/api/errors'
import { usePagedList } from '@/lib/hooks/usePagedList'
import { formatDateTime } from '@/lib/utils/date-format'
import { CreateButton, PageHeader } from '@/components/admin/PageHeader'
import { ListToolbar } from '@/components/admin/SearchBox'
import { Pagination } from '@/components/admin/Pagination'
import { DetailRow } from '@/components/admin/DetailRow'
import { DetailPanelRow, IdChip, isClosedStatus, RowActions, StatusChip, TableMessageRow } from '@/components/admin/Table'
import {
  popupColumnCount,
  popupExposurePolicyLabels,
  popupStatusClasses,
  popupStatusLabels,
  popupTargetTypeLabels,
  thumbColor,
} from '@/features/popup/lib/popup-form'
import { PopupFormModal } from '@/features/popup/ui/PopupFormModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; popup: AdminPopup } | null

export default function PopupPage() {
  const list = usePagedList<AdminPopup>({
    fetchPage: getAdminPopups,
    getLoadErrorMessage: () => '팝업 목록을 불러오지 못했습니다.',
  })
  const [selectedPopup, setSelectedPopup] = useState<AdminPopup | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const handleSelectPopup = async (popupId: number) => {
    if (selectedPopup?.id === popupId) {
      setSelectedPopup(null)
      return
    }

    setDetailLoading(true)
    list.setErrorMessage('')
    try {
      const response = await getAdminPopup(popupId)
      if (response.isSuccess) {
        setSelectedPopup(response.result)
      }
    } catch {
      list.setErrorMessage('팝업 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openEditModal = async (popupId: number) => {
    const popup = selectedPopup?.id === popupId ? selectedPopup : (await getAdminPopup(popupId)).result
    setSelectedPopup(popup)
    setModal({ mode: 'edit', popup })
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
  }

  const handleSubmit = async (payload: AdminPopupPayload, file: File | null) => {
    if (!modal) return
    const isEdit = modal.mode === 'edit'

    setSaving(true)
    try {
      if (isEdit) {
        const response = await updateAdminPopup(modal.popup.id, payload, file)
        if (!response.isSuccess) {
          throw new Error(response.message || '팝업 수정에 실패했습니다.')
        }
        setSelectedPopup(response.result)
      } else if (file) {
        const response = await createAdminPopup(payload, file)
        if (!response.isSuccess) {
          throw new Error(response.message || '팝업 생성에 실패했습니다.')
        }
        setSelectedPopup(response.result)
      }

      setModal(null)
      list.reload(isEdit ? undefined : 0)
    } catch (error) {
      logApiError(isEdit ? '팝업 수정 실패:' : '팝업 생성 실패:', error, { payload })
      console.table(getApiErrorInfo(error).fieldErrors ?? [])
      alert(getApiErrorMessage(error, isEdit ? '팝업 수정에 실패했습니다.' : '팝업 생성에 실패했습니다.'))
    } finally {
      setSaving(false)
    }
  }

  const handleCancelPopup = async (popup: AdminPopup) => {
    const confirmed = window.confirm(`'${popup.popupTitle}' 팝업을 강제 종료할까요?`)
    if (!confirmed) return

    try {
      const response = await cancelAdminPopup(popup.id)
      if (response.isSuccess) {
        setSelectedPopup(response.result)
        list.reload()
      }
    } catch {
      alert('팝업 강제 종료에 실패했습니다.')
    }
  }

  return (
    <div className="event-page-container">
      <PageHeader
        title="팝업 관리"
        description="앱 진입 시 노출되는 이벤트 팝업을 생성하고 노출 기간과 이미지를 관리합니다."
        action={<CreateButton label="새 팝업 만들기" onClick={() => setModal({ mode: 'create' })} />}
      />

      <ListToolbar
        search={{
          value: list.searchQuery,
          onChange: list.setSearchQuery,
          placeholder: '팝업명 검색',
          onSubmit: list.submitSearch,
        }}
        totalCount={list.totalElements}
      />

      {list.errorMessage ? <p className="login-message">{list.errorMessage}</p> : null}

      <div className="event-table-panel">
        <table className="event-table">
          <thead>
            <tr>
              <th>Popup ID</th>
              <th>팝업 · 이미지</th>
              <th>연결 대상</th>
              <th>노출 정책</th>
              <th>노출 기간</th>
              <th>상태</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {list.loading ? (
              <TableMessageRow colSpan={popupColumnCount}>로딩 중...</TableMessageRow>
            ) : list.items.length === 0 ? (
              <TableMessageRow colSpan={popupColumnCount}>등록된 팝업이 없습니다.</TableMessageRow>
            ) : (
              list.items.map((popup) => {
                const isOpen = selectedPopup?.id === popup.id

                return (
                  <Fragment key={popup.id}>
                    <tr
                      className={`event-row ${isOpen ? 'open' : ''}`}
                      onClick={() => void handleSelectPopup(popup.id)}
                    >
                      <td>
                        <IdChip value={popup.id} />
                      </td>
                      <td>
                        <div className="thumb">
                          {popup.imageUrl ? (
                            <img className="thumb-box" src={popup.imageUrl} alt="" />
                          ) : (
                            <div className="thumb-box" style={{ background: thumbColor(String(popup.id)) }}>
                              POPUP
                            </div>
                          )}
                          <div className="thumb-meta">
                            <div className="thumb-name">{popup.popupTitle}</div>
                            <div className="s3path">{popup.content}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="link-ev">
                          <IdChip value={popup.targetId} />
                          <span className="ev-lite">{popupTargetTypeLabels[popup.contentTargetType]}</span>
                        </div>
                      </td>
                      <td>{popupExposurePolicyLabels[popup.exposurePolicy]}</td>
                      <td className="period">
                        {formatDateTime(popup.displayStartAt)}
                        <span className="dash"> ~ </span>
                        {formatDateTime(popup.displayEndAt)}
                      </td>
                      <td>
                        <StatusChip
                          className={popupStatusClasses[popup.status]}
                          label={popupStatusLabels[popup.status] ?? popup.status}
                        />
                      </td>
                      <td>
                        <RowActions>
                          <button className="btn-edit" onClick={() => void openEditModal(popup.id)} type="button">
                            수정
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={() => void handleCancelPopup(popup)}
                            disabled={isClosedStatus(popup.status)}
                            type="button"
                          >
                            종료
                          </button>
                        </RowActions>
                      </td>
                    </tr>
                    {isOpen && selectedPopup ? (
                      <DetailPanelRow colSpan={popupColumnCount} loading={detailLoading}>
                        {selectedPopup.imageUrl ? (
                          <img
                            src={selectedPopup.imageUrl}
                            alt=""
                            style={{ maxWidth: 240, borderRadius: 8, border: '1px solid #ebebef' }}
                          />
                        ) : null}
                        <DetailRow label="팝업 제목" value={selectedPopup.popupTitle} />
                        <DetailRow label="내용" value={selectedPopup.content} />
                        <DetailRow label="CTA" value={selectedPopup.ctaText} />
                        <DetailRow label="대상" value={`${popupTargetTypeLabels[selectedPopup.contentTargetType]} ${selectedPopup.targetId}`} />
                        <DetailRow label="노출 정책" value={popupExposurePolicyLabels[selectedPopup.exposurePolicy]} />
                        <DetailRow label="노출 시작" value={formatDateTime(selectedPopup.displayStartAt)} />
                        <DetailRow label="노출 종료" value={formatDateTime(selectedPopup.displayEndAt)} />
                        <DetailRow label="생성일시" value={formatDateTime(selectedPopup.createdAt)} />
                        <DetailRow label="수정일시" value={formatDateTime(selectedPopup.updatedAt)} />
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
        <PopupFormModal
          editingPopup={modal.mode === 'edit' ? modal.popup : null}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}
