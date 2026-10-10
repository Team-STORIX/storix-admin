import type { ReactNode } from 'react'

/** 상세 패널의 "라벨 : 값" 한 줄 */
export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="report-detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  )
}
