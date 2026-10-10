import type { ReactNode } from 'react'
import { PlusIcon } from './icons'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  /** 우측 액션 영역 (예: 생성 버튼) */
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={className ? `page-head ${className}` : 'page-head'}>
      <div>
        <h1>{title}</h1>
        {description ? <p className="page-sub">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

type CreateButtonProps = {
  label: string
  onClick: () => void
}

/** 목록 페이지 우상단 "새 ○○ 만들기" 버튼 */
export function CreateButton({ label, onClick }: CreateButtonProps) {
  return (
    <button className="btn-primary" onClick={onClick} type="button">
      <PlusIcon />
      {label}
    </button>
  )
}
