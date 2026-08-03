'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  cancelAdminBanner,
  createAdminBanner,
  getAdminBanner,
  getAdminBanners,
  updateAdminBanner,
  type AdminBanner,
  type AdminBannerPayload,
  type BannerContentTargetType,
  type BannerStatus,
} from '@/lib/api/banner.api'

type FormState = {
  targetId: string
  contentTargetType: BannerContentTargetType
  bannerTitle: string
  displayStartAt: string
  displayEndAt: string
  file: File | null
}

const emptyForm: FormState = {
  targetId: '',
  contentTargetType: 'APP_EVENT',
  bannerTitle: '',
  displayStartAt: '',
  displayEndAt: '',
  file: null,
}

const statusLabels: Record<BannerStatus, string> = {
  SCHEDULED: '예약됨',
  ACTIVE: '노출중',
  ENDED: '종료됨',
  CANCELED: '종료됨',
}

const targetTypeLabels: Record<BannerContentTargetType, string> = {
  APP_EVENT: '전체 유저',
}

export default function BannerPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([])
  const [selectedBanner, setSelectedBanner] = useState<AdminBanner | null>(null)
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

  const fetchBanners = async (page = currentPage, keyword = appliedKeyword) => {
    setLoading(true)
    setErrorMessage('')
    try {
      const response = await getAdminBanners(page, keyword.trim() || undefined)
      if (response.isSuccess) {
        setBanners(response.result.content)
        setCurrentPage(response.result.page)
        setTotalPages(response.result.totalPages)
        setTotalElements(response.result.totalElements)
      }
    } catch {
      setErrorMessage('배너 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchBanners(currentPage, appliedKeyword)
  }, [currentPage, appliedKeyword])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCurrentPage(0)
    setAppliedKeyword(searchQuery)
  }

  const handleSelectBanner = async (bannerId: number) => {
    if (selectedBanner?.id === bannerId) {
      setSelectedBanner(null)
      return
    }

    setDetailLoading(true)
    setErrorMessage('')
    try {
      const response = await getAdminBanner(bannerId)
      if (response.isSuccess) {
        setSelectedBanner(response.result)
      }
    } catch {
      setErrorMessage('배너 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openCreateModal = () => {
    setForm(emptyForm)
    setModalMode('create')
  }

  const openEditModal = async (bannerId: number) => {
    const detail =
      selectedBanner?.id === bannerId
        ? selectedBanner
        : (await getAdminBanner(bannerId)).result

    setSelectedBanner(detail)
    setForm({
      targetId: String(detail.targetId),
      contentTargetType: detail.contentTargetType,
      bannerTitle: detail.bannerTitle,
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

    if (!form.targetId.trim() || !form.bannerTitle.trim() || !form.displayStartAt || !form.displayEndAt) {
      alert('타겟 ID, 배너명, 노출 기간을 모두 입력해주세요.')
      return
    }

    const targetId = Number(form.targetId)
    if (!Number.isInteger(targetId) || targetId <= 0) {
      alert('연결 앱 이벤트 ID는 양의 정수로 입력해주세요.')
      return
    }

    if (modalMode === 'create' && !form.file) {
      alert('배너 이미지를 선택해주세요.')
      return
    }

    const payload: AdminBannerPayload = {
      targetId,
      contentTargetType: form.contentTargetType,
      bannerTitle: form.bannerTitle.trim(),
      displayStartAt: toIsoString(form.displayStartAt),
      displayEndAt: toIsoString(form.displayEndAt),
    }

    setSaving(true)
    try {
      if (modalMode === 'edit' && selectedBanner) {
        const response = await updateAdminBanner(selectedBanner.id, payload, form.file)
        if (response.isSuccess) {
          setSelectedBanner(response.result)
        }
      } else if (form.file) {
        const response = await createAdminBanner(payload, form.file)
        if (response.isSuccess) {
          setSelectedBanner(response.result)
          setCurrentPage(0)
        }
      }

      setModalMode(null)
      setForm(emptyForm)
      await fetchBanners(modalMode === 'create' ? 0 : currentPage, appliedKeyword)
    } catch {
      alert(modalMode === 'edit' ? '배너 수정에 실패했습니다.' : '배너 생성에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelBanner = async (banner: AdminBanner) => {
    const confirmed = window.confirm(`'${banner.bannerTitle}' 배너를 강제 종료할까요?`)
    if (!confirmed) return

    try {
      const response = await cancelAdminBanner(banner.id)
      if (response.isSuccess) {
        setSelectedBanner(response.result)
        await fetchBanners(currentPage, appliedKeyword)
      }
    } catch {
      alert('배너 강제 종료에 실패했습니다.')
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
          <h1>배너 관리</h1>
          <p className="page-sub">인앱 이벤트에 연결되는 배너를 생성하고 노출 기간과 이미지를 관리합니다.</p>
        </div>
        <span className="filter-note">전체 {totalElements}건</span>
      </div>

      {errorMessage ? <p className="login-message">{errorMessage}</p> : null}

      {selectedBanner ? (
        <section className="banner-detail-card">
          <button className="user-breadcrumb" onClick={() => setSelectedBanner(null)} type="button">
            배너 관리 &gt; 상세
          </button>

          {detailLoading ? (
            <p className="login-message">상세 정보를 불러오는 중...</p>
          ) : (
            <>
              <div className="banner-detail-title-row">
                <h2>{selectedBanner.bannerTitle}</h2>
                <span className={`event-state-chip ${bannerStatusClass(selectedBanner.status)}`}>
                  {statusLabels[selectedBanner.status] ?? selectedBanner.status}
                </span>
              </div>

              <div className="banner-detail-info">
                <span>이미지</span>
                {selectedBanner.imageUrl ? (
                  <img className="banner-detail-image" src={selectedBanner.imageUrl} alt="" />
                ) : (
                  <div className="banner-detail-image placeholder">BANNER</div>
                )}

                <span>노출 기간</span>
                <strong>
                  {formatDateRange(selectedBanner.displayStartAt, selectedBanner.displayEndAt)}
                  <button
                    className="banner-end-button"
                    onClick={() => void handleCancelBanner(selectedBanner)}
                    disabled={selectedBanner.status === 'ENDED' || selectedBanner.status === 'CANCELED'}
                    type="button"
                  >
                    노출 종료
                  </button>
                </strong>

                <span>연결 대상</span>
                <strong>
                  {targetTypeLabels[selectedBanner.contentTargetType]} {selectedBanner.targetId}
                </strong>
              </div>

              <div className="action-buttons">
                <button className="btn-approve" onClick={() => void openEditModal(selectedBanner.id)} type="button">
                  수정
                </button>
                <button className="dark-back-button" onClick={() => setSelectedBanner(null)} type="button">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  목록으로
                </button>
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          <div className="event-table-panel banner-list-panel">
            <div className="table-title-row banner-title-row">
              <h2>배너 발송 목록</h2>
              <button className="btn-primary compact" onClick={openCreateModal} type="button">
                새 배너 만들기
              </button>
              <form className="banner-search-form" onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="검색"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <button type="submit" aria-label="검색">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </form>
            </div>

            <table className="event-table banner-list-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>발송 대상</th>
                  <th>노출 기간</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4}>로딩 중...</td>
                  </tr>
                ) : banners.length === 0 ? (
                  <tr>
                    <td colSpan={4}>등록된 배너가 없습니다.</td>
                  </tr>
                ) : (
                  banners.map((banner) => (
                    <tr
                      className="event-row"
                      key={banner.id}
                      onClick={() => void handleSelectBanner(banner.id)}
                    >
                      <td>{banner.bannerTitle}</td>
                      <td>{targetTypeLabels[banner.contentTargetType]}</td>
                      <td>{formatDateRange(banner.displayStartAt, banner.displayEndAt)}</td>
                      <td>
                        <span className={`event-state-chip ${bannerStatusClass(banner.status)}`}>
                          {statusLabels[banner.status] ?? banner.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {renderPagination()}
        </>
      )}

      {modalMode ? (
        <div className="modal-overlay" onClick={closeModal}>
          <form className="modal-container" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2>{modalMode === 'edit' ? '배너 수정' : '새 배너 만들기'}</h2>
              <p>연결할 앱 이벤트, 노출 기간과 배너 이미지를 입력합니다.</p>
            </div>

            <div className="modal-body">
              <label className="field">
                <span>연결 앱 이벤트 ID</span>
                <input
                  type="number"
                  value={form.targetId}
                  onChange={(event) => setForm((current) => ({ ...current, targetId: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>대상 유형</span>
                <select
                  value={form.contentTargetType}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, contentTargetType: event.target.value as BannerContentTargetType }))
                  }
                >
                  <option value="APP_EVENT">앱 이벤트</option>
                </select>
              </label>
              <label className="field">
                <span>배너명</span>
                <input
                  value={form.bannerTitle}
                  onChange={(event) => setForm((current) => ({ ...current, bannerTitle: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>노출 시작</span>
                <input
                  type="datetime-local"
                  value={form.displayStartAt}
                  onChange={(event) => setForm((current) => ({ ...current, displayStartAt: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>노출 종료</span>
                <input
                  type="datetime-local"
                  value={form.displayEndAt}
                  onChange={(event) => setForm((current) => ({ ...current, displayEndAt: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>{modalMode === 'edit' ? '이미지 변경' : '배너 이미지'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((current) => ({ ...current, file: event.target.files?.[0] ?? null }))
                  }
                />
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn-modal-cancel" onClick={closeModal} disabled={saving} type="button">
                취소
              </button>
              <button className="btn-modal-confirm" disabled={saving} type="submit">
                {saving ? '저장 중...' : modalMode === 'edit' ? '수정 완료' : '배너 생성'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

function toIsoString(value: string) {
  return new Date(value).toISOString()
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function bannerStatusClass(status: BannerStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'event-state-active'
    case 'ENDED':
    case 'CANCELED':
      return 'event-state-canceled'
    case 'SCHEDULED':
    default:
      return 'event-state-scheduled'
  }
}

function formatDateRange(start: string, end: string) {
  return `${formatDateDot(start)} ~ ${formatDateDot(end)}`
}

function formatDateDot(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}
