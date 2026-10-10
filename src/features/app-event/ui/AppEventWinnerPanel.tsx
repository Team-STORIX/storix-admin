'use client'

import { useEffect, useState } from 'react'
import {
  drawAppEventWinners,
  getAttendanceEventWinners,
  type AppEvent,
  type AppEventWinnerDrawResult,
  type AttendanceEventWinnerResult,
} from '@/lib/api/app-event.api'
import { createAdminNotification } from '@/lib/api/notification.api'
import { getApiErrorMessage, logApiError } from '@/lib/api/errors'
import { isCurrentMarketingPushTimeAllowed, MARKETING_PUSH_TIME_LABEL } from '@/lib/utils/notification-rules'
import { isClosedStatus, StatusChip } from '@/components/admin/Table'
import { parseWinnerCount } from '../lib/app-event-form'
import { getDefaultWinnerPushContent, getDefaultWinnerPushTitle } from '../lib/app-event-labels'

type AppEventWinnerPanelProps = {
  event: AppEvent
}

/**
 * 당첨자 추첨 / 출석 응모권 조회 / 당첨자 푸시 발송 카드.
 * 상세가 펼쳐질 때마다 마운트되므로 입력값과 결과는 이벤트별로 초기화된다.
 */
export function AppEventWinnerPanel({ event }: AppEventWinnerPanelProps) {
  const [winnerCount, setWinnerCount] = useState('')
  const [winnerPushTitle, setWinnerPushTitle] = useState(() => getDefaultWinnerPushTitle(event))
  const [winnerPushContent, setWinnerPushContent] = useState(() => getDefaultWinnerPushContent(event))
  const [winnerDrawResult, setWinnerDrawResult] = useState<AppEventWinnerDrawResult | null>(null)
  const [attendanceWinnerResult, setAttendanceWinnerResult] = useState<AttendanceEventWinnerResult | null>(null)
  const [drawingWinners, setDrawingWinners] = useState(false)
  const [loadingAttendanceWinners, setLoadingAttendanceWinners] = useState(false)
  const [sendingWinnerPush, setSendingWinnerPush] = useState(false)

  const isAttendance = event.eventType === 'ATTENDANCE'
  const canDraw = isClosedStatus(event.status)
  const busy = drawingWinners || loadingAttendanceWinners

  const loadAttendanceWinners = async (showFailureAlert = true) => {
    setLoadingAttendanceWinners(true)
    try {
      const response = await getAttendanceEventWinners(event.id)
      if (response.isSuccess) {
        setAttendanceWinnerResult(response.result)
      }
    } catch (error) {
      logApiError('출석 이벤트 당첨자 조회 실패:', error, { appEventId: event.id })
      if (showFailureAlert) {
        alert(getApiErrorMessage(error, '출석 이벤트 당첨자 조회에 실패했습니다.'))
      }
    } finally {
      setLoadingAttendanceWinners(false)
    }
  }

  // 출석 이벤트는 상세를 열 때 확정 결과를 함께 불러온다.
  // 이 패널은 event.id 로 key 가 지정되어 이벤트가 바뀌면 다시 마운트된다.
  useEffect(() => {
    if (isAttendance) void loadAttendanceWinners(false)
    // 마운트 시 1회만 실행
  }, [])

  const handleDrawWinners = async () => {
    const parsedWinnerCount = parseWinnerCount(winnerCount)
    if (parsedWinnerCount === null) {
      alert('추첨 인원은 1명 이상 1,000명 이하의 정수로 입력해주세요.')
      return
    }

    const confirmed = window.confirm(
      `'${event.name}' 이벤트의 당첨자 ${parsedWinnerCount}명을 확정할까요?\n확정 후에는 이후 참여자가 반영되지 않으며 재추첨할 수 없습니다.`,
    )
    if (!confirmed) return

    setDrawingWinners(true)
    try {
      const response = await drawAppEventWinners(event.id, parsedWinnerCount)
      if (response.isSuccess) {
        setWinnerDrawResult(response.result)
        if (isAttendance) {
          await loadAttendanceWinners(false)
        }
        alert(
          response.result.alreadyFinalized
            ? '이미 확정된 당첨자 결과를 불러왔습니다.'
            : `${response.result.winners.length}명의 당첨자를 확정했습니다.`,
        )
      }
    } catch (error) {
      alert(getApiErrorMessage(error, '당첨자 확정에 실패했습니다.'))
    } finally {
      setDrawingWinners(false)
    }
  }

  const handleSendWinnerPush = async () => {
    if (!event.hasWinner) {
      alert('당첨자를 뽑는 이벤트만 당첨자 푸시를 보낼 수 있습니다.')
      return
    }

    const title = winnerPushTitle.trim()
    const content = winnerPushContent.trim()
    if (!title || !content) {
      alert('푸시 제목과 내용을 입력해주세요.')
      return
    }

    if (!isCurrentMarketingPushTimeAllowed()) {
      alert(`마케팅 푸시는 ${MARKETING_PUSH_TIME_LABEL}에만 즉시 발송할 수 있습니다. 푸시 관리에서 허용 시간으로 예약해주세요.`)
      return
    }

    const confirmed = window.confirm(
      `'${event.name}' 이벤트의 확정 당첨자에게 푸시를 즉시 발송할까요?\n푸시 관리 목록에도 기록됩니다.`,
    )
    if (!confirmed) return

    setSendingWinnerPush(true)
    try {
      const response = await createAdminNotification({
        title,
        content,
        notificationType: 'MARKETING',
        targetAudience: 'EVENT_WINNERS',
        sendType: 'IMMEDIATE',
        scheduledAt: null,
        targetType: 'APP_EVENT',
        eventTargetId: event.id,
        targetLink: null,
      })

      if (response.isSuccess) {
        alert(`당첨자 대상 푸시가 생성되었습니다. 알림 ID: ${response.result}`)
      }
    } catch (error) {
      alert(getApiErrorMessage(error, '당첨자 푸시 생성에 실패했습니다.'))
    } finally {
      setSendingWinnerPush(false)
    }
  }

  return (
    <div className="winner-draw-card">
      <div className="winner-draw-head">
        <div>
          <strong>당첨자 추첨</strong>
          <p>이벤트가 종료된 뒤 최초 1회만 확정됩니다. 이미 확정된 이벤트는 재추첨하지 않고 기존 당첨자를 불러옵니다.</p>
        </div>
        <StatusChip
          className={canDraw ? 'event-state-ended' : 'event-state-scheduled'}
          label={canDraw ? '추첨 가능' : '종료 필요'}
        />
      </div>
      <div className="winner-draw-actions">
        <input
          type="number"
          inputMode="numeric"
          min="1"
          max="1000"
          placeholder="당첨자 수"
          value={winnerCount}
          onChange={(changeEvent) => setWinnerCount(changeEvent.target.value)}
          disabled={busy}
        />
        <button
          className="table-action-button winner-primary-button"
          disabled={busy}
          onClick={() => void handleDrawWinners()}
          type="button"
        >
          {drawingWinners ? '추첨 중...' : '당첨자 확정하기'}
        </button>
        {isAttendance ? (
          <button
            className="table-action-button"
            disabled={busy}
            onClick={() => void loadAttendanceWinners()}
            type="button"
          >
            {loadingAttendanceWinners ? '조회 중...' : '출석 응모권/결과 조회'}
          </button>
        ) : null}
      </div>
      <p className="winner-draw-note">
        확정된 당첨자는 발송 대상 “이벤트 당첨자”와 이 appEventID로 연결됩니다. 아래에서 푸시를 만들면 푸시 알림 관리에도 기록됩니다.
      </p>
      <div className="winner-push-panel">
        <label>
          <span>푸시 제목</span>
          <input
            value={winnerPushTitle}
            onChange={(changeEvent) => setWinnerPushTitle(changeEvent.target.value)}
            maxLength={100}
            disabled={sendingWinnerPush}
          />
        </label>
        <label>
          <span>푸시 내용</span>
          <textarea
            value={winnerPushContent}
            onChange={(changeEvent) => setWinnerPushContent(changeEvent.target.value)}
            maxLength={500}
            disabled={sendingWinnerPush}
          />
        </label>
        <p className="marketing-push-notice">
          당첨자 푸시는 마케팅 알림으로 발송되며, 한국 시간 기준 {MARKETING_PUSH_TIME_LABEL}에만 즉시 발송할 수 있습니다.
        </p>
        <div className="winner-push-actions">
          <button
            className="table-action-button winner-push-link"
            disabled={sendingWinnerPush || !(winnerDrawResult || attendanceWinnerResult)}
            onClick={() => void handleSendWinnerPush()}
            type="button"
          >
            {sendingWinnerPush ? '푸시 생성 중...' : '당첨자에게 즉시 푸시 보내기'}
          </button>
          <a
            className="winner-push-manage-link"
            href={`/event/push?targetAudience=EVENT_WINNERS&targetType=APP_EVENT&eventTargetId=${event.id}`}
          >
            푸시 관리에서 작성
          </a>
        </div>
      </div>
      {attendanceWinnerResult?.appEventId === event.id ? (
        <div className="winner-result-list">
          <div className="winner-result-summary">
            후보자 {attendanceWinnerResult.candidateCount}명 · 총 응모권 {attendanceWinnerResult.totalTickets}장 · 확정 당첨자 {attendanceWinnerResult.winners.length}명
          </div>
          {attendanceWinnerResult.winners.length > 0 ? (
            attendanceWinnerResult.winners.map((winner) => (
              <div className="winner-result-row" key={winner.userId}>
                <span>{winner.drawOrder}위</span>
                <strong>{winner.nickName || '탈퇴 사용자'}</strong>
                <small>User ID {winner.userId} · 응모권 {winner.ticketCount}장 · 출석 {winner.totalAttendedDays}일</small>
              </div>
            ))
          ) : (
            <div className="winner-empty">아직 확정된 당첨자가 없습니다.</div>
          )}
        </div>
      ) : winnerDrawResult ? (
        <div className="winner-result-list">
          <div className="winner-result-summary">
            {winnerDrawResult.alreadyFinalized ? '기존 확정 결과' : '새 확정 결과'} · 총 {winnerDrawResult.winners.length}명
          </div>
          {winnerDrawResult.winners.map((winner) => (
            <div className="winner-result-row" key={winner.userId}>
              <span>{winner.drawOrder}위</span>
              <strong>{winner.nickName || '탈퇴 사용자'}</strong>
              <small>User ID {winner.userId}</small>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
