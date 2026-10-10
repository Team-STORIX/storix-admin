import { ChevronLeftIcon, ChevronRightIcon } from './icons'

type PaginationProps = {
  /** 0-based 현재 페이지 */
  currentPage: number
  totalPages: number
  onChange: (page: number) => void
  /** 지정하면 앞뒤 생략(…)이 있는 축약 페이지 목록을 보여준다. */
  maxVisiblePages?: number
  className?: string
}

const ELLIPSIS = -1

/** 1-based 페이지 번호 목록. 축약이 필요한 자리는 ELLIPSIS(음수)로 표시한다. */
function getPageItems(displayPage: number, totalPages: number, maxVisiblePages?: number): number[] {
  if (!maxVisiblePages || totalPages <= maxVisiblePages) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (displayPage <= 3) {
    return [1, 2, 3, 4, ELLIPSIS, totalPages]
  }
  if (displayPage >= totalPages - 2) {
    return [1, ELLIPSIS, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, ELLIPSIS, displayPage - 1, displayPage, displayPage + 1, ELLIPSIS, totalPages]
}

export function Pagination({ currentPage, totalPages, onChange, maxVisiblePages, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const displayPage = currentPage + 1
  const pageItems = getPageItems(displayPage, totalPages, maxVisiblePages)

  return (
    <div className={className ? `pagination ${className}` : 'pagination'}>
      <button
        className="pagination-button"
        onClick={() => onChange(Math.max(0, currentPage - 1))}
        disabled={currentPage === 0}
        type="button"
      >
        <ChevronLeftIcon />
      </button>

      {pageItems.map((page, index) =>
        page === ELLIPSIS ? (
          <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
        ) : (
          <button
            key={page}
            className={`pagination-button ${displayPage === page ? 'active' : ''}`}
            onClick={() => onChange(page - 1)}
            type="button"
          >
            {page}
          </button>
        ),
      )}

      <button
        className="pagination-button"
        onClick={() => onChange(Math.min(totalPages - 1, currentPage + 1))}
        disabled={currentPage >= totalPages - 1}
        type="button"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}
