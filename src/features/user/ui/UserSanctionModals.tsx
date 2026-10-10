'use client'

import { useState, type ReactNode } from 'react'
import type { AdminUserContent } from '@/lib/api/user.api'
import { formatDateTimeWithDot } from '@/lib/utils/date-format'
import { ModalOverlay } from '@/components/admin/Modal'
import { TextAreaField } from '@/components/admin/FormField'
import { accountSanctionOptions, type AccountSanctionAction } from '../lib/user-labels'

type SanctionModalShellProps = {
  title: string
  description: ReactNode
  confirmLabel: string
  confirmClassName?: string
  saving: boolean
  onClose: () => void
  onConfirm: () => void
  children: ReactNode
}

/** 유저 제재 계열 모달 공통 껍데기 (취소 / 확정 버튼 + 저장 중 비활성화) */
function SanctionModalShell({
  title,
  description,
  confirmLabel,
  confirmClassName = 'btn-modal-confirm',
  saving,
  onClose,
  onConfirm,
  children,
}: SanctionModalShellProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <div className="modal-container user-action-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <div className="modal-body">{children}</div>

        <div className="modal-actions">
          <button className="btn-modal-cancel" onClick={onClose} disabled={saving} type="button">
            취소
          </button>
          <button className={confirmClassName} onClick={onConfirm} disabled={saving} type="button">
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalOverlay>
  )
}

const MEMO_LABEL = '내부기록용 메모를 작성해주세요.'
const MEMO_PLACEHOLDER = '내부 기록용 메모 입력'

type ContentDeleteModalProps = {
  nickName: string
  content: AdminUserContent
  saving: boolean
  onClose: () => void
  onConfirm: (memo: string) => void
}

export function ContentDeleteModal({ nickName, content, saving, onClose, onConfirm }: ContentDeleteModalProps) {
  const [memo, setMemo] = useState('')

  return (
    <SanctionModalShell
      title="콘텐츠 삭제"
      description={`${nickName}님의 콘텐츠를 삭제합니다.`}
      confirmLabel="콘텐츠 삭제"
      confirmClassName="btn-modal-confirm black"
      saving={saving}
      onClose={onClose}
      onConfirm={() => onConfirm(memo.trim())}
    >
      <div className="content-delete-preview">
        <span>
          {nickName} · {formatDateTimeWithDot(content.createdAt)}
        </span>
        <strong>{content.content}</strong>
      </div>
      <TextAreaField label={MEMO_LABEL} value={memo} onChange={setMemo} placeholder={MEMO_PLACEHOLDER} />
    </SanctionModalShell>
  )
}

type AccountSanctionModalProps = {
  saving: boolean
  onClose: () => void
  onConfirm: (action: AccountSanctionAction, memo: string) => void
}

export function AccountSanctionModal({ saving, onClose, onConfirm }: AccountSanctionModalProps) {
  const [action, setAction] = useState<AccountSanctionAction>('SUSPENDED')
  const [memo, setMemo] = useState('')

  return (
    <SanctionModalShell
      title="계정 제재"
      description="계정 제재 항목을 선택하세요."
      confirmLabel="처리 완료 확정"
      saving={saving}
      onClose={onClose}
      onConfirm={() => onConfirm(action, memo.trim())}
    >
      <div className="sanction-option-list">
        {accountSanctionOptions.map((option) => (
          <button
            key={option.value}
            className={`sanction-option ${action === option.value ? 'selected' : ''}`}
            onClick={() => setAction(option.value)}
            type="button"
          >
            <strong>{option.title}</strong>
            <span>{option.description}</span>
          </button>
        ))}
      </div>
      <TextAreaField label={MEMO_LABEL} value={memo} onChange={setMemo} placeholder={MEMO_PLACEHOLDER} />
    </SanctionModalShell>
  )
}
