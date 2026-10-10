import type { ReportStatus } from '@/lib/api/report.api'
import { reportStatusBadgeClasses, reportStatusLabels } from '../lib/report-labels'

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={reportStatusBadgeClasses[status]}>
      <span className="bdot"></span>
      {reportStatusLabels[status]}
    </span>
  )
}
