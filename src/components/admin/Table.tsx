import type { ReactNode } from 'react'

/** 테이블 본문에 한 줄 메시지(로딩/빈 목록)를 표시한다. */
export function TableMessageRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan}>{children}</td>
    </tr>
  )
}

type DetailPanelRowProps = {
  colSpan: number
  loading: boolean
  children: ReactNode
}

/** 목록 행 아래로 펼쳐지는 상세 패널 행 */
export function DetailPanelRow({ colSpan, loading, children }: DetailPanelRowProps) {
  return (
    <tr className="detail-row">
      <td colSpan={colSpan}>
        <div className="report-detail-panel">
          {loading ? <div>상세 정보를 불러오는 중...</div> : children}
        </div>
      </td>
    </tr>
  )
}

/** 상태 칩 */
export function StatusChip({ className, label }: { className: string; label: string }) {
  return <span className={`event-state-chip ${className}`}>{label}</span>
}

/** ID 칩 (앞에 점이 붙는 형태) */
export function IdChip({ value }: { value: number | string }) {
  return (
    <span className="id-chip">
      <span className="dot"></span>
      {value}
    </span>
  )
}

/** 상세 행 열기 전용 테이블 (행 클릭 전파를 막는 액션 영역) */
export function RowActions({ className = 'action-buttons', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={className} onClick={(event) => event.stopPropagation()}>
      {children}
    </div>
  )
}

/** 종료/강제 종료 상태인지 (취소 버튼 비활성 판단) */
export const isClosedStatus = (status: string) => status === 'ENDED' || status === 'CANCELED'
