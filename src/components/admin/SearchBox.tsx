import type { FormEvent } from 'react'
import { SearchIcon } from './icons'

export type SearchBoxProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  /** 지정하면 form으로 렌더링되어 Enter로 검색을 적용한다. 없으면 입력 즉시 필터링용 div. */
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}

export function SearchBox({ value, onChange, placeholder, onSubmit }: SearchBoxProps) {
  const content = (
    <>
      <SearchIcon />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </>
  )

  if (onSubmit) {
    return (
      <form className="search-box" onSubmit={onSubmit}>
        {content}
      </form>
    )
  }

  return <div className="search-box">{content}</div>
}

type ListToolbarProps = {
  search: SearchBoxProps
  totalCount: number
}

/** 검색창 + "전체 N건" 툴바 */
export function ListToolbar({ search, totalCount }: ListToolbarProps) {
  return (
    <div className="toolbar">
      <SearchBox {...search} />
      <span className="filter-note">전체 {totalCount}건</span>
    </div>
  )
}
