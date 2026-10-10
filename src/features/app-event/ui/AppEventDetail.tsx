import type { AppEvent } from '@/lib/api/app-event.api'
import { formatDateTime } from '@/lib/utils/date-format'
import { DetailRow } from '@/components/admin/DetailRow'
import { formatAttendanceRewards } from '../lib/app-event-form'
import { eventTypeLabels } from '../lib/app-event-labels'
import { AppEventWinnerPanel } from './AppEventWinnerPanel'

/** 펼쳐진 행에 표시되는 앱 이벤트 상세 */
export function AppEventDetail({ event }: { event: AppEvent }) {
  return (
    <>
      <DetailRow label="이벤트명" value={event.name} />
      <DetailRow label="설명" value={event.description} />
      <DetailRow label="이벤트 유형" value={eventTypeLabels[event.eventType]} />
      <DetailRow label="페이지 키" value={event.pageKey || '유형별 기본 화면'} />
      <DetailRow label="시작일시" value={formatDateTime(event.startAt)} />
      <DetailRow label="종료일시" value={formatDateTime(event.endAt)} />
      <DetailRow label="보상 설정" value={formatAttendanceRewards(event.attendanceRewards, event.eventType)} />
      <DetailRow label="생성일시" value={formatDateTime(event.createdAt)} />
      <DetailRow label="수정일시" value={formatDateTime(event.updatedAt)} />
      {event.hasWinner ? (
        <AppEventWinnerPanel key={event.id} event={event} />
      ) : (
        <div className="winner-draw-card muted">
          <strong>당첨자 추첨 없음</strong>
          <p>이 이벤트는 hasWinner=false라 당첨자 확정 API를 호출하지 않습니다.</p>
        </div>
      )}
    </>
  )
}
