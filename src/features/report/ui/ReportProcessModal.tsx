'use client'

import { useState } from 'react'
import type { ProcessAction, TargetType } from '@/lib/api/report.api'
import { ModalOverlay } from '@/components/admin/Modal'
import {
  isContentDeletable,
  processActionDescriptions,
  processActionLabels,
  processActions,
  reportTargetTypeLabels,
} from '../lib/report-labels'

type ReportProcessModalProps = {
  targetType: TargetType
  onClose: () => void
  onConfirm: (actions: ProcessAction[], memo: string) => Promise<void>
}

/** 계정 정지와 계정 삭제는 상호 배타적으로 선택된다. */
function toggleProcessAction(selected: ProcessAction[], action: ProcessAction): ProcessAction[] {
  if (selected.includes(action)) {
    return selected.filter((item) => item !== action)
  }

  if (action === 'ACCOUNT_SUSPENDED') {
    return [...selected.filter((item) => item !== 'ACCOUNT_DELETED'), action]
  }

  if (action === 'ACCOUNT_DELETED') {
    return [...selected.filter((item) => item !== 'ACCOUNT_SUSPENDED'), action]
  }

  return [...selected, action]
}

/** 신고 처리 모달: 처리 액션 선택 + 내부 메모 */
export function ReportProcessModal({ targetType, onClose, onConfirm }: ReportProcessModalProps) {
  const [selectedActions, setSelectedActions] = useState<ProcessAction[]>([])
  const [processComment, setProcessComment] = useState('')
  const contentDeleteDisabled = !isContentDeletable(targetType)

  const handleConfirm = () => {
    if (selectedActions.length === 0) {
      alert('처리 액션을 하나 이상 선택해주세요.')
      return
    }

    if (selectedActions.includes('CONTENT_DELETED') && contentDeleteDisabled) {
      alert(`${reportTargetTypeLabels[targetType]} 신고는 콘텐츠 삭제 처리를 할 수 없습니다.`)
      return
    }

    void onConfirm(selectedActions, processComment.trim())
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-container" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>신고 처리</h2>
          <p>복수 액션을 적용할 수 있습니다. 계정 정지와 계정 삭제는 동시에 적용할 수 없습니다.</p>
        </div>

        <div className="modal-body">
          <div className="action-checkboxes">
            {processActions.map((action) => {
              const isDisabled = action === 'CONTENT_DELETED' && contentDeleteDisabled
              const isChecked = selectedActions.includes(action)

              return (
                <label
                  key={action}
                  className={`action-checkbox ${isChecked ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => setSelectedActions((current) => toggleProcessAction(current, action))}
                  />
                  <div className="checkbox-content">
                    <div className="checkbox-title">{processActionLabels[action]}</div>
                    <div className="checkbox-desc">{processActionDescriptions[action]}</div>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="modal-comment-section">
            <label className="comment-label">내부기록용 메모 작성해 주세요.</label>
            <textarea
              className="comment-textarea"
              placeholder="내부 기록용 메모 입력"
              value={processComment}
              onChange={(event) => setProcessComment(event.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose}>
            취소
          </button>
          <button className="btn-modal-confirm" onClick={handleConfirm}>
            처리 완료 확정
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}
