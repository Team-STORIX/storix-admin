'use client'

import { useState } from 'react'
import {
  cancelAdminBanner,
  createAdminBanner,
  getAdminBanner,
  getAdminBanners,
  updateAdminBanner,
  type AdminBanner,
  type AdminBannerPayload,
} from '@/lib/api/banner.api'
import { usePagedList } from '@/lib/hooks/usePagedList'
import { formatDateRange } from '@/lib/utils/date-format'
import { CreateButton, PageHeader } from '@/components/admin/PageHeader'
import { ListToolbar } from '@/components/admin/SearchBox'
import { Pagination } from '@/components/admin/Pagination'
import { ChevronLeftIcon } from '@/components/admin/icons'
import { IdChip, isClosedStatus, RowActions, StatusChip, TableMessageRow } from '@/components/admin/Table'
import {
  bannerColumnCount,
  bannerStatusClasses,
  bannerStatusLabels,
  bannerTargetTypeLabels,
} from '@/features/banner/lib/banner-form'
import { BannerFormModal } from '@/features/banner/ui/BannerFormModal'

type ModalState = { mode: 'create' } | { mode: 'edit'; banner: AdminBanner } | null

export default function BannerPage() {
  const list = usePagedList<AdminBanner>({
    fetchPage: getAdminBanners,
    getLoadErrorMessage: () => '배너 목록을 불러오지 못했습니다.',
  })
  const [selectedBanner, setSelectedBanner] = useState<AdminBanner | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)

  const handleSelectBanner = async (bannerId: number) => {
    if (selectedBanner?.id === bannerId) {
      setSelectedBanner(null)
      return
    }

    setDetailLoading(true)
    list.setErrorMessage('')
    try {
      const response = await getAdminBanner(bannerId)
      if (response.isSuccess) {
        setSelectedBanner(response.result)
      }
    } catch {
      list.setErrorMessage('배너 상세를 불러오지 못했습니다.')
    } finally {
      setDetailLoading(false)
    }
  }

  const openEditModal = async (bannerId: number) => {
    const banner = selectedBanner?.id === bannerId ? selectedBanner : (await getAdminBanner(bannerId)).result
    setSelectedBanner(banner)
    setModal({ mode: 'edit', banner })
  }

  const closeModal = () => {
    if (saving) return
    setModal(null)
  }

  const handleSubmit = async (payload: AdminBannerPayload, file: File | null) => {
    if (!modal) return
    const isEdit = modal.mode === 'edit'

    setSaving(true)
    try {
      if (isEdit) {
        const response = await updateAdminBanner(modal.banner.id, payload, file)
        if (response.isSuccess) {
          setSelectedBanner(response.result)
        }
      } else if (file) {
        const response = await createAdminBanner(payload, file)
        if (response.isSuccess) {
          setSelectedBanner(response.result)
        }
      }

      setModal(null)
      list.reload(isEdit ? undefined : 0)
    } catch {
      alert(isEdit ? '배너 수정에 실패했습니다.' : '배너 생성에 실패했습니다.')
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
        list.reload()
      }
    } catch {
      alert('배너 강제 종료에 실패했습니다.')
    }
  }

  return (
    <div className="event-page-container">
      <PageHeader
        title="배너 관리"
        description="인앱 이벤트에 연결되는 배너를 생성하고 노출 기간과 이미지를 관리합니다."
        action={<CreateButton label="새 배너 만들기" onClick={() => setModal({ mode: 'create' })} />}
      />

      <ListToolbar
        search={{
          value: list.searchQuery,
          onChange: list.setSearchQuery,
          placeholder: '배너명 검색',
          onSubmit: list.submitSearch,
        }}
        totalCount={list.totalElements}
      />

      {list.errorMessage ? <p className="login-message">{list.errorMessage}</p> : null}

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
                <StatusChip
                  className={bannerStatusClasses[selectedBanner.status]}
                  label={bannerStatusLabels[selectedBanner.status] ?? selectedBanner.status}
                />
              </div>

              <div className="banner-detail-info">
                <span>이미지</span>
                {selectedBanner.imageUrl ? (
                  <img className="banner-detail-image" src={selectedBanner.imageUrl} alt="" />
                ) : (
                  <div className="banner-detail-image placeholder">BANNER</div>
                )}

                <span>노출 기간</span>
                <strong>{formatDateRange(selectedBanner.displayStartAt, selectedBanner.displayEndAt)}</strong>

                <span>배너 제어</span>
                <strong>
                  <button
                    className="btn-cancel"
                    onClick={() => void handleCancelBanner(selectedBanner)}
                    disabled={isClosedStatus(selectedBanner.status)}
                    type="button"
                  >
                    강제 종료
                  </button>
                </strong>

                <span>연결 대상</span>
                <strong>
                  {bannerTargetTypeLabels[selectedBanner.contentTargetType]} {selectedBanner.targetId}
                </strong>
              </div>

              <div className="banner-detail-actions">
                <button className="btn-back" onClick={() => setSelectedBanner(null)} type="button">
                  <ChevronLeftIcon />
                  목록으로
                </button>
                <div className="action-buttons">
                  <button className="btn-edit" onClick={() => void openEditModal(selectedBanner.id)} type="button">
                    수정
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          <div className="event-table-panel">
            <div className="table-title-row">
              <h2>배너 발송 목록</h2>
            </div>

            <table className="event-table">
              <thead>
                <tr>
                  <th>Banner ID</th>
                  <th>제목</th>
                  <th>발송 대상</th>
                  <th>노출 기간</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {list.loading ? (
                  <TableMessageRow colSpan={bannerColumnCount}>로딩 중...</TableMessageRow>
                ) : list.items.length === 0 ? (
                  <TableMessageRow colSpan={bannerColumnCount}>등록된 배너가 없습니다.</TableMessageRow>
                ) : (
                  list.items.map((banner) => (
                    <tr className="event-row" key={banner.id} onClick={() => void handleSelectBanner(banner.id)}>
                      <td>
                        <IdChip value={banner.id} />
                      </td>
                      <td>
                        <div className="ev-name">{banner.bannerTitle}</div>
                      </td>
                      <td>{bannerTargetTypeLabels[banner.contentTargetType]}</td>
                      <td className="period">{formatDateRange(banner.displayStartAt, banner.displayEndAt)}</td>
                      <td>
                        <StatusChip
                          className={bannerStatusClasses[banner.status]}
                          label={bannerStatusLabels[banner.status] ?? banner.status}
                        />
                      </td>
                      <td>
                        <RowActions>
                          <button className="btn-edit" onClick={() => void openEditModal(banner.id)} type="button">
                            수정
                          </button>
                          <button
                            className="btn-cancel"
                            onClick={() => void handleCancelBanner(banner)}
                            disabled={isClosedStatus(banner.status)}
                            type="button"
                          >
                            종료
                          </button>
                        </RowActions>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={list.currentPage} totalPages={list.totalPages} onChange={list.goToPage} />
        </>
      )}

      {modal ? (
        <BannerFormModal
          editingBanner={modal.mode === 'edit' ? modal.banner : null}
          saving={saving}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      ) : null}
    </div>
  )
}
