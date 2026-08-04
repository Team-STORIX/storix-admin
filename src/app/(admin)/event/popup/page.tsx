'use client'

import { FormEvent, Fragment, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import {
  cancelAdminPopup,
  createAdminPopup,
  getAdminPopup,
  getAdminPopups,
  updateAdminPopup,
  type AdminPopup,
  type AdminPopupPayload,
  type PopupContentTargetType,
  type PopupExposurePolicy,
  type PopupStatus,
} from '@/lib/api/popup.api'

type FormState = {
  targetId: string
  contentTargetType: PopupContentTargetType
  exposurePolicy: PopupExposurePolicy
  popupTitle: string
  content: string
  ctaText: string
  displayStartAt: string
  displayEndAt: string
  file: File | null
}

const emptyForm: FormState = {
  targetId: '',
  contentTargetType: 'APP_EVENT',
  exposurePolicy: 'ALWAYS_DURING_PERIOD',
  popupTitle: '',
  content: '',
  ctaText: '',
  displayStartAt: '',
  displayEndAt: '',
  file: null,
}

type ApiErrorBody = {
  code?: string
  message?: string
  fieldErrors?: unknown
}

const statusLabels: Record<PopupStatus, string> = {
  SCHEDULED: '예약',
  ACTIVE: '노출중',
  ENDED: '종료',
  CANCELED: '강제 종료',
}

const targetTypeLabels: Record<PopupContentTargetType, string> = {
  APP_EVENT: '앱 이벤트',
}

const exposurePolicyLabels: Record<PopupExposurePolicy, string> = {
  ALWAYS_DURING_PERIOD: '기간 내 항상 노출',
  ONCE_PER_DAY: '하루 한 번 노출',
}

export default function PopupPage() {
  const [popups, setPopups] = useState<AdminPopup[]>([])
  const [selectedPopup, setSelectedPopup] = useState<AdminPopup | null>(null)
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

  const fetchPopups = async (page = currentPage, keyword = appliedKeyword) => {
    setLoading(true)
    setErrorMessage('')
    try {
      const response = await getAdminPopups(page, keyword.trim() || undefined)
      if (response.isSuccess) {
        setPopups(response.result.content)
        setCurrentPage(response.result.page)
        setTotalPages(response.result.totalPages)
        setTotalElements(response.result.totalElements)
      }
    } catch {
      setErrorMessage('팝업 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchPopups(currentPage, appliedKeyword)
  }, [currentPage, appliedKeyword])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCurrentPage(0)
    setAppliedKeyword(searchQuery)
  }

  const handleSelectPopup = async (popupId: number) => {
    if (selectedPopup?.id === popupId) {
      setSelectedPopup(null)
      return
    }

    setDetailLoading(true)
    setErrorMessage('')
    try {
      const response = await getAdminPopup(popupId)
      if (response.isSuccess) {
        setSelectedPopup(response.result)
      }
    } catch {
      setErrorMessage('팝업 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openCreateModal = () => {
    setForm(emptyForm)
    setModalMode('create')
  }

  const openEditModal = async (popupId: number) => {
    const detail =
      selectedPopup?.id === popupId
        ? selectedPopup
        : (await getAdminPopup(popupId)).result

    setSelectedPopup(detail)
    setForm({
      targetId: String(detail.targetId),
      contentTargetType: detail.contentTargetType,
      exposurePolicy: detail.exposurePolicy,
      popupTitle: detail.popupTitle,
      content: detail.content,
      ctaText: detail.ctaText,
      displayStartAt: toDatetimeLocalValue(detail.displayStartAt),
      displayEndAt: toDatetimeLocalValue(detail.displayEndAt),
      file: null,
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

    if (!form.targetId.trim() || !form.popupTitle.trim() || !form.content.trim() || !form.ctaText.trim() || !form.displayStartAt || !form.displayEndAt) {
      alert('연결 앱 이벤트 ID, 제목, 내용, CTA, 노출 기간을 모두 입력해주세요.')
      return
    }

    if (form.popupTitle.trim().length > 100 || form.content.trim().length > 500 || form.ctaText.trim().length > 40) {
      alert('팝업 제목은 100자, 내용은 500자, CTA는 40자 이하로 입력해주세요.')
      return
    }

    const targetId = Number(form.targetId)
    if (!Number.isInteger(targetId) || targetId <= 0) {
      alert('연결 앱 이벤트 ID는 양의 정수로 입력해주세요.')
      return
    }

    if (modalMode === 'create' && !form.file) {
      alert('팝업 이미지를 선택해주세요.')
      return
    }
    if (form.displayStartAt >= form.displayEndAt) {
      alert('노출 종료 일시는 시작 일시 이후여야 합니다.')
      return
    }

    const payload: AdminPopupPayload = {
      appEventId: targetId,
      contentTargetType: form.contentTargetType,
      exposurePolicy: form.exposurePolicy,
      popupTitle: form.popupTitle.trim(),
      content: form.content.trim(),
      ctaText: form.ctaText.trim(),
      displayStartAt: toLocalDateTimeString(form.displayStartAt),
      displayEndAt: toLocalDateTimeString(form.displayEndAt),
    }

    setSaving(true)
    try {
      if (modalMode === 'edit' && selectedPopup) {
        const response = await updateAdminPopup(selectedPopup.id, payload, form.file)
        if (!response.isSuccess) {
          throw new Error(response.message || '팝업 수정에 실패했습니다.')
        }
        setSelectedPopup(response.result)
      } else if (form.file) {
        const response = await createAdminPopup(payload, form.file)
        if (!response.isSuccess) {
          throw new Error(response.message || '팝업 생성에 실패했습니다.')
        }
        setSelectedPopup(response.result)
        setCurrentPage(0)
      }

      setModalMode(null)
      setForm(emptyForm)
      await fetchPopups(modalMode === 'create' ? 0 : currentPage, appliedKeyword)
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorBody>
      const serverMessage = axiosError.response?.data?.message
      console.error(modalMode === 'edit' ? '팝업 수정 실패:' : '팝업 생성 실패:', {
        status: axiosError.response?.status,
        code: axiosError.response?.data?.code,
        message: serverMessage ?? (error instanceof Error ? error.message : undefined),
        fieldErrors: axiosError.response?.data?.fieldErrors,
        data: axiosError.response?.data,
        payload,
      })
      console.table(axiosError.response?.data?.fieldErrors ?? [])
      alert(serverMessage || (error instanceof Error ? error.message : modalMode === 'edit' ? '팝업 수정에 실패했습니다.' : '팝업 생성에 실패했습니다.'))
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
        await fetchPopups(currentPage, appliedKeyword)
      }
    } catch {
      alert('팝업 강제 종료에 실패했습니다.')
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
          <h1>팝업 관리</h1>
          <p className="page-sub">
            앱 진입 시 노출되는 이벤트 팝업을 생성하고 노출 기간과 이미지를 관리합니다.
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5v14" />
          </svg>
          새 팝업 만들기
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
            placeholder="팝업명 검색"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </form>
        <span className="filter-note">전체 {totalElements}건</span>
      </div>

      {errorMessage ? <p className="login-message">{errorMessage}</p> : null}

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
            {loading ? (
              <tr>
                <td colSpan={7}>로딩 중...</td>
              </tr>
            ) : popups.length === 0 ? (
              <tr>
                <td colSpan={7}>등록된 팝업이 없습니다.</td>
              </tr>
            ) : (
              popups.map((popup) => {
                const isOpen = selectedPopup?.id === popup.id

                return (
                  <Fragment key={popup.id}>
                    <tr
                      className={`event-row ${isOpen ? 'open' : ''}`}
                      onClick={() => void handleSelectPopup(popup.id)}
                    >
                      <td>
                        <span className="id-chip">
                          <span className="dot"></span>
                          {popup.id}
                        </span>
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
                          <span className="id-chip">
                            <span className="dot"></span>
                            {popup.targetId}
                          </span>
                          <span className="ev-lite">{targetTypeLabels[popup.contentTargetType]}</span>
                        </div>
                      </td>
                      <td>{exposurePolicyLabels[popup.exposurePolicy]}</td>
                      <td className="period">
                        {formatDateTime(popup.displayStartAt)}
                        <span className="dash"> → </span>
                        <br />
                        {formatDateTime(popup.displayEndAt)}
                      </td>
                      <td>
                        <span className={`badge ${statusClass(popup.status)}`}>
                          {statusLabels[popup.status] ?? popup.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons" onClick={(clickEvent) => clickEvent.stopPropagation()}>
                          <button className="btn-approve" onClick={() => void openEditModal(popup.id)} type="button">
                            수정
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => void handleCancelPopup(popup)}
                            disabled={popup.status === 'ENDED' || popup.status === 'CANCELED'}
                            type="button"
                          >
                            종료
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen && selectedPopup ? (
                      <tr className="detail-row">
                        <td colSpan={7}>
                          <div className="report-detail-panel">
                            {detailLoading ? (
                              <div>상세 정보를 불러오는 중...</div>
                            ) : (
                              <>
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
                                <DetailRow label="대상" value={`${targetTypeLabels[selectedPopup.contentTargetType]} ${selectedPopup.targetId}`} />
                                <DetailRow label="노출 정책" value={exposurePolicyLabels[selectedPopup.exposurePolicy]} />
                                <DetailRow label="노출 시작" value={formatDateTime(selectedPopup.displayStartAt)} />
                                <DetailRow label="노출 종료" value={formatDateTime(selectedPopup.displayEndAt)} />
                                <DetailRow label="생성일시" value={formatDateTime(selectedPopup.createdAt)} />
                                <DetailRow label="수정일시" value={formatDateTime(selectedPopup.updatedAt)} />
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
              <h2>{modalMode === 'edit' ? '팝업 수정' : '새 팝업 만들기'}</h2>
            </div>

            <div className="modal-body">
              <label className="field">
                <span>연결 앱 이벤트 ID</span>
                <input
                  inputMode="numeric"
                  placeholder="appEventId 입력"
                  value={form.targetId}
                  onChange={(event) => setForm((current) => ({ ...current, targetId: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>연결 대상</span>
                <select
                  value={form.contentTargetType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contentTargetType: event.target.value as PopupContentTargetType }))
                  }
                >
                  <option value="APP_EVENT">앱 이벤트</option>
                </select>
              </label>
              <label className="field">
                <span>노출 정책</span>
                <select
                  value={form.exposurePolicy}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, exposurePolicy: event.target.value as PopupExposurePolicy }))
                  }
                >
                  <option value="ALWAYS_DURING_PERIOD">기간 내 항상 노출</option>
                  <option value="ONCE_PER_DAY">하루 한 번 노출</option>
                </select>
              </label>
              <label className="field">
                <span>제목</span>
                <input
                  placeholder="관리용 팝업 제목 입력"
                  value={form.popupTitle}
                  onChange={(event) => setForm((current) => ({ ...current, popupTitle: event.target.value }))}
                />
              </label>
              <label className="field popup-image-field">
                <span>이미지</span>
                <div className="popup-upload-box">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                    }
                  />
                  <div className="popup-upload-placeholder">
                    <span>+</span>
                    <small>{form.file ? form.file.name : '이미지 업로드 (drag & drop)'}</small>
                  </div>
                </div>
              </label>
              <label className="field">
                <span>내용</span>
                <input
                  placeholder="팝업 내용 입력"
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>CTA</span>
                <input
                  placeholder="CTA 버튼 문구 입력"
                  value={form.ctaText}
                  onChange={(event) => setForm((current) => ({ ...current, ctaText: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>시작일</span>
                <input
                  type="datetime-local"
                  value={form.displayStartAt}
                  onChange={(event) => setForm((current) => ({ ...current, displayStartAt: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>종료일</span>
                <input
                  type="datetime-local"
                  value={form.displayEndAt}
                  onChange={(event) => setForm((current) => ({ ...current, displayEndAt: event.target.value }))}
                />
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeModal} disabled={saving} type="button">
                취소
              </button>
              <button className="btn-modal-confirm" disabled={saving} type="submit">
                {saving ? '저장 중...' : modalMode === 'edit' ? '수정 완료' : '팝업 생성'}
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
  return new Date(value).toLocaleString('ko-KR')
}

function toDatetimeLocalValue(value: string) {
  return value.replace(' ', 'T').slice(0, 16)
}

function toLocalDateTimeString(value: string) {
  return value.replace('T', ' ').slice(0, 16)
}

function statusClass(status: PopupStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'g'
    case 'ENDED':
    case 'CANCELED':
      return 'a'
    case 'SCHEDULED':
    default:
      return 'n'
  }
}

function thumbColor(id: string) {
  const colors = [
    ['#EC1E79', '#B60E5A'],
    ['#3457C4', '#22368A'],
    ['#0E9F6E', '#0A7A54'],
  ]
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const [a, b] = colors[h % colors.length]
  return `linear-gradient(135deg,${a},${b})`
}
