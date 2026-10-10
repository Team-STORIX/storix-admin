import type { ReportDetail } from '@/lib/api/report.api'
import { formatLocaleDateTime } from '@/lib/utils/date-format'
import { ChevronLeftIcon } from '@/components/admin/icons'
import { DetailRow } from '@/components/admin/DetailRow'
import { PageHeader } from '@/components/admin/PageHeader'
import { processActionLabels, reportTargetTypeLabels } from '../lib/report-labels'
import { ReportStatusBadge } from './ReportStatusBadge'

type ReportDetailViewProps = {
  detail: ReportDetail
  onBack: () => void
  onReject: () => void
  onProcess: () => void
}

/** 신고 상세 화면 (요약 / 원문 / 묶인 신고 / 채팅 메시지 / 처리 버튼) */
export function ReportDetailView({ detail, onBack, onReject, onProcess }: ReportDetailViewProps) {
  const { summary, reportedContent } = detail

  return (
    <div className="report-detail-container">
      <PageHeader title="신고 정보 요약" description={<ReportStatusBadge status={detail.status} />} />

      <div className="report-detail-panel">
        <DetailRow label="신고 유형" value={reportTargetTypeLabels[detail.targetType]} />
        <div className="report-detail-row">
          <span className="detail-label">피신고 대상</span>
          <span className="detail-value report-highlight">
            {summary.reportedUserNickName} (U-{summary.reportedUserId})
          </span>
        </div>
        <DetailRow label="신고 건수" value={`${summary.reportCount}건`} />
        <DetailRow label="신고 사유" value={summary.reason} />
        <DetailRow label="신고 발생 위치" value={summary.location} />
        <DetailRow label="최초 신고일시" value={formatLocaleDateTime(summary.firstReportedAt)} />

        <div className="report-content-section">
          <h3>피신고 콘텐츠 원문</h3>
          <div className="report-content-box">
            <p className="content-meta">
              {reportedContent.authorNickName} · {formatLocaleDateTime(reportedContent.createdAt)}
            </p>
            <p className="content-text">{reportedContent.content}</p>
          </div>
        </div>

        {detail.processActions?.length ? (
          <div className="report-detail-row">
            <span className="detail-label">조치 및 코멘트</span>
            <span className="detail-value" style={{ color: '#dc2626' }}>
              {detail.processActions.map((action) => processActionLabels[action]).join(', ')}
              {detail.processMemo && ` / ${detail.processMemo}`}
            </span>
          </div>
        ) : null}

        {detail.reports.length > 0 ? (
          <div className="report-content-section">
            <h3>묶인 신고 목록</h3>
            <div className="report-content-box">
              {detail.reports.map((report) => (
                <p key={report.reportId} className="content-meta">
                  #{report.reportId} {report.reporterNickName} · {report.reason}
                  {report.otherReason ? ` / ${report.otherReason}` : ''} · {formatLocaleDateTime(report.reportedAt)}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        {reportedContent.chatMessages?.length ? (
          <div className="report-content-section">
            <h3>채팅 신고 메시지</h3>
            <div className="report-content-box">
              {reportedContent.chatMessages.map((message) => (
                <p key={message.messageId} className="content-text">
                  {message.senderNickName} · {message.messageType} · {formatLocaleDateTime(message.createdAt)}
                  <br />
                  {message.message}
                </p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="report-actions">
          <button className="btn-back" onClick={onBack}>
            <ChevronLeftIcon />
            목록으로
          </button>
          {detail.status === 'RECEIVED' && (
            <div className="action-buttons">
              <button className="btn-reject" onClick={onReject}>
                반려
              </button>
              <button className="btn-approve" onClick={onProcess}>
                처리
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
