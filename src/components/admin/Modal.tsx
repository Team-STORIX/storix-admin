import type { FormEvent, ReactNode } from 'react'

type ModalOverlayProps = {
  onClose: () => void
  children: ReactNode
}

/** 바깥 클릭 시 닫히는 오버레이. 컨테이너 쪽에서 클릭 전파를 막아야 한다. */
export function ModalOverlay({ onClose, children }: ModalOverlayProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      {children}
    </div>
  )
}

type FormModalProps = {
  title: string
  description?: ReactNode
  submitLabel: string
  saving: boolean
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  children: ReactNode
}

/**
 * 생성/수정 폼 모달 공통 껍데기.
 * header / body / footer(취소·확정) 구조와 저장 중 비활성화를 담당한다.
 */
export function FormModal({ title, description, submitLabel, saving, onClose, onSubmit, children }: FormModalProps) {
  return (
    <ModalOverlay onClose={onClose}>
      <form className="modal-container" onClick={(event) => event.stopPropagation()} onSubmit={onSubmit}>
        <div className="modal-header">
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>

        <div className="modal-body">{children}</div>

        <div className="modal-footer">
          <button className="btn-modal-cancel" onClick={onClose} disabled={saving} type="button">
            취소
          </button>
          <button className="btn-modal-confirm" disabled={saving} type="submit">
            {saving ? '저장 중...' : submitLabel}
          </button>
        </div>
      </form>
    </ModalOverlay>
  )
}
