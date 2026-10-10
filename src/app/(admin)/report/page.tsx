'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  getReportList,
  getReportDetail,
  processReport,
  type ProcessAction,
  type ReportDetail,
  type ReportListItem,
  type ReportListParams,
  type ReportStatus,
  type TargetType,
} from '@/lib/api/report.api'
import { formatLoadErrorMessage, getApiErrorInfo, getApiErrorMessage, logApiError } from '@/lib/api/errors'
import { formatLocaleDateTime } from '@/lib/utils/date-format'
import { PageHeader } from '@/components/admin/PageHeader'
import { SearchBox } from '@/components/admin/SearchBox'
import { Pagination } from '@/components/admin/Pagination'
import { TableMessageRow } from '@/components/admin/Table'
import {
  reportColumnCount,
  reportStatusLabels,
  reportStatuses,
  reportTargetTypeLabels,
  reportTargetTypes,
} from '@/features/report/lib/report-labels'
import { ReportDetailView } from '@/features/report/ui/ReportDetailView'
import { ReportProcessModal } from '@/features/report/ui/ReportProcessModal'
import { ReportStatusBadge } from '@/features/report/ui/ReportStatusBadge'

const ALL = '전체'
type TargetTypeFilter = TargetType | typeof ALL
type StatusFilter = ReportStatus | typeof ALL

export default function ReportPage() {
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  const [selectedReportDetail, setSelectedReportDetail] = useState<ReportDetail | null>(null)
  const [targetTypeFilter, setTargetTypeFilter] = useState<TargetTypeFilter>(ALL)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL)
  const [reportedUserKeyword, setReportedUserKeyword] = useState('')
  const [appliedReportedUserKeyword, setAppliedReportedUserKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [showProcessModal, setShowProcessModal] = useState(false)
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  // 신고 목록 조회
  useEffect(() => {
    let ignore = false

    const fetchReports = async () => {
      setLoading(true)
      setErrorMessage('')

      const params: ReportListParams = { page: currentPage }
      if (targetTypeFilter !== ALL) params.targetType = targetTypeFilter
      if (statusFilter !== ALL) params.status = statusFilter
      if (appliedReportedUserKeyword.trim()) {
        params.reportedUserKeyword = appliedReportedUserKeyword.trim()
      }
      if (dateFilter) {
        params.startAt = `${dateFilter}T00:00:00`
        params.endAt = `${dateFilter}T23:59:59`
      }

      try {
        const response = await getReportList(params)
        if (ignore) return
        if (response.isSuccess) {
          setReports(response.result.content)
          setTotalPages(response.result.totalPages)
          setTotalElements(response.result.totalElements)
        }
      } catch (error) {
        if (ignore) return
        const errorInfo = getApiErrorInfo(error)
        console.error(
          `신고 목록 조회 실패: status=${errorInfo.status ?? 'unknown'}, message=${errorInfo.message ?? 'unknown'}, params=${JSON.stringify(params)}`,
        )
        logApiError('신고 목록 조회 실패:', error, { params })
        setErrorMessage(formatLoadErrorMessage('신고 목록을 불러오지 못했습니다.', error))
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    void fetchReports()

    return () => {
      ignore = true
    }
  }, [currentPage, targetTypeFilter, statusFilter, dateFilter, appliedReportedUserKeyword, reloadKey])

  // 신고 상세 조회
  useEffect(() => {
    if (!selectedReportId) {
      setSelectedReportDetail(null)
      return
    }

    let ignore = false

    getReportDetail(selectedReportId)
      .then((response) => {
        if (!ignore && response.isSuccess) {
          setSelectedReportDetail(response.result)
        }
      })
      .catch((error) => {
        if (!ignore) console.error('신고 상세 조회 실패:', error)
      })

    return () => {
      ignore = true
    }
  }, [selectedReportId])

  /** 처리/반려 후 목록 화면으로 돌아가며 첫 페이지를 다시 조회한다. */
  const backToListAndRefresh = () => {
    setSelectedReportId(null)
    setSelectedReportDetail(null)
    setCurrentPage(0)
    setReloadKey((key) => key + 1)
  }

  const handleReject = async () => {
    if (!selectedReportId || !selectedReportDetail) return

    try {
      await processReport(selectedReportId, { status: 'REJECTED' })
      backToListAndRefresh()
    } catch (error) {
      console.error('신고 반려 실패:', error)
      alert('신고 반려에 실패했습니다.')
    }
  }

  const handleProcessConfirm = async (actions: ProcessAction[], memo: string) => {
    if (!selectedReportId) return

    const payload = {
      status: 'COMPLETED' as const,
      processActions: actions,
      processMemo: memo || undefined,
    }

    try {
      await processReport(selectedReportId, payload)
      setShowProcessModal(false)
      backToListAndRefresh()
    } catch (error) {
      logApiError('신고 처리 실패:', error, {
        reportCaseId: selectedReportId,
        targetType: selectedReportDetail?.targetType,
        processActions: actions.join(', '),
        payload,
      })
      console.table(getApiErrorInfo(error).fieldErrors ?? [])
      alert(getApiErrorMessage(error, '신고 처리에 실패했습니다.'))
    }
  }

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCurrentPage(0)
    setAppliedReportedUserKeyword(reportedUserKeyword)
  }

  const resetSearch = () => {
    setReportedUserKeyword('')
    setAppliedReportedUserKeyword('')
    setCurrentPage(0)
  }

  return (
    <div className="report-page-container">
      {!selectedReportDetail ? (
        <>
          <PageHeader title="신고 관리" description="신고 접수 목록" />

          <form className="toolbar" onSubmit={handleSearchSubmit}>
            <SearchBox value={reportedUserKeyword} onChange={setReportedUserKeyword} placeholder="피신고자 닉네임 검색" />

            <div className="select-wrap">
              <select value={targetTypeFilter} onChange={(event) => setTargetTypeFilter(event.target.value as TargetTypeFilter)}>
                <option value={ALL}>신고 유형</option>
                {reportTargetTypes.map((type) => (
                  <option key={type} value={type}>
                    {reportTargetTypeLabels[type]}
                  </option>
                ))}
              </select>
            </div>

            <div className="select-wrap">
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="date-input"
                placeholder="신고일자"
              />
            </div>

            <div className="select-wrap">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
                <option value={ALL}>처리 상태</option>
                {reportStatuses.map((status) => (
                  <option key={status} value={status}>
                    {reportStatusLabels[status]}
                  </option>
                ))}
              </select>
            </div>

            <button className="btn-approve" type="submit">
              검색
            </button>
            {appliedReportedUserKeyword ? (
              <button className="btn-reject" onClick={resetSearch} type="button">
                초기화
              </button>
            ) : null}

            <span className="filter-note">전체 {totalElements}건</span>
          </form>

          {errorMessage ? <p className="login-message">{errorMessage}</p> : null}

          {loading ? (
            <div className="event-table-panel">
              <div style={{ padding: '60px', textAlign: 'center', color: '#9a9aa4' }}>로딩 중...</div>
            </div>
          ) : (
            <>
              <div className="event-table-panel">
                <table className="event-table">
                  <thead>
                    <tr>
                      <th>케이스 ID</th>
                      <th>신고 유형</th>
                      <th>피신고자</th>
                      <th>신고 건수</th>
                      <th>접수일시</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <TableMessageRow colSpan={reportColumnCount}>신고 내역이 없습니다.</TableMessageRow>
                    ) : (
                      reports.map((report) => (
                        <tr key={report.reportCaseId} className="event-row" onClick={() => setSelectedReportId(report.reportCaseId)}>
                          <td>{report.reportCaseId}</td>
                          <td>{reportTargetTypeLabels[report.targetType]}</td>
                          <td>{report.reportedUserNickName} (U-{report.reportedUserId})</td>
                          <td>{report.reportCount}건</td>
                          <td className="period">{formatLocaleDateTime(report.createdAt)}</td>
                          <td>
                            <ReportStatusBadge status={report.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} maxVisiblePages={5} />
            </>
          )}
        </>
      ) : (
        <ReportDetailView
          detail={selectedReportDetail}
          onBack={() => setSelectedReportId(null)}
          onReject={() => void handleReject()}
          onProcess={() => setShowProcessModal(true)}
        />
      )}

      {showProcessModal && selectedReportDetail ? (
        <ReportProcessModal
          targetType={selectedReportDetail.targetType}
          onClose={() => setShowProcessModal(false)}
          onConfirm={handleProcessConfirm}
        />
      ) : null}
    </div>
  )
}
