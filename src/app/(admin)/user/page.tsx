'use client'

import { FormEvent, useState } from 'react'
import {
  createAdminUserSanction,
  getAdminUser,
  getAdminUserContents,
  getAdminUserSanctions,
  getAdminUsers,
  type AdminUser,
  type AdminUserContent,
  type AdminUserDetail,
  type AdminUserListParams,
  type AdminUserSanction,
  type CreateSanctionRequest,
} from '@/lib/api/user.api'
import { getApiErrorInfo, getApiErrorMessage, logApiError } from '@/lib/api/errors'
import { formatIsoDate } from '@/lib/utils/date-format'
import { PageHeader } from '@/components/admin/PageHeader'
import { Pagination } from '@/components/admin/Pagination'
import { SearchIcon } from '@/components/admin/icons'
import { TableMessageRow } from '@/components/admin/Table'
import { formatProvider, userColumns } from '@/features/user/lib/user-labels'
import { UserDetailCard } from '@/features/user/ui/UserDetailCard'
import { AccountSanctionModal, ContentDeleteModal } from '@/features/user/ui/UserSanctionModals'
import { UserStateChip } from '@/features/user/ui/UserStateChip'

/** 숫자면 유저 ID, 아니면 닉네임으로 검색한다. */
function toUserSearchParams(query: string, page: number): AdminUserListParams {
  const params: AdminUserListParams = { page }
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return params

  const numericQuery = Number(trimmedQuery)
  if (Number.isInteger(numericQuery) && numericQuery > 0) {
    params.userId = numericQuery
  } else {
    params.nickName = trimmedQuery
  }
  return params
}

export default function UserPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [userContents, setUserContents] = useState<AdminUserContent[]>([])
  const [userSanctions, setUserSanctions] = useState<AdminUserSanction[]>([])
  const [contentDeleteTarget, setContentDeleteTarget] = useState<AdminUserContent | null>(null)
  const [showAccountSanctionModal, setShowAccountSanctionModal] = useState(false)

  const fetchUsers = async (query: string, page = 0) => {
    setLoading(true)
    setErrorMessage('')

    try {
      const response = await getAdminUsers(toUserSearchParams(query, page))
      if (response.isSuccess) {
        setUsers(response.result.content)
        setCurrentPage(response.result.page)
        setTotalPages(response.result.totalPages)
      }
    } catch (error) {
      console.error('유저 목록 조회 실패:', getApiErrorInfo(error))
      setUsers([])
      setErrorMessage(getApiErrorMessage(error, '유저 목록을 불러오지 못했습니다.'))
    } finally {
      setLoading(false)
    }
  }

  const openUserDetail = async (userId: number) => {
    setDetailLoading(true)
    setErrorMessage('')

    try {
      const [detailResponse, contentsResponse, sanctionsResponse] = await Promise.all([
        getAdminUser(userId),
        getAdminUserContents(userId, { page: 0, size: 10 }),
        getAdminUserSanctions(userId, { page: 0, size: 10 }),
      ])

      if (detailResponse.isSuccess) setSelectedUser(detailResponse.result)
      if (contentsResponse.isSuccess) setUserContents(contentsResponse.result.content)
      if (sanctionsResponse.isSuccess) setUserSanctions(sanctionsResponse.result.content)
    } catch (error) {
      console.error('유저 상세 조회 실패:', getApiErrorInfo(error))
      setErrorMessage(getApiErrorMessage(error, '유저 상세 정보를 불러오지 못했습니다.'))
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setHasSearched(true)
    setSelectedUser(null)
    setAppliedSearchQuery(searchQuery)
    await fetchUsers(searchQuery, 0)
  }

  const closeContentDeleteModal = () => {
    if (saving) return
    setContentDeleteTarget(null)
  }

  const closeAccountSanctionModal = () => {
    if (saving) return
    setShowAccountSanctionModal(false)
  }

  const submitSanction = async (payload: CreateSanctionRequest, actionName: string, onSuccess: () => void) => {
    if (!selectedUser) return

    setSaving(true)
    try {
      const response = await createAdminUserSanction(selectedUser.userId, payload)
      if (response.isSuccess) {
        onSuccess()
        await openUserDetail(selectedUser.userId)
      }
    } catch (error) {
      logApiError(`${actionName} 실패:`, error, { payload })
      alert(getApiErrorMessage(error, `${actionName}에 실패했습니다.`))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="user-page-container">
      <PageHeader title="유저 관리" className="user-page-head" />

      {selectedUser ? (
        <UserDetailCard
          user={selectedUser}
          contents={userContents}
          sanctions={userSanctions}
          loading={detailLoading}
          onBack={() => setSelectedUser(null)}
          onDeleteContent={setContentDeleteTarget}
          onSanctionAccount={() => setShowAccountSanctionModal(true)}
        />
      ) : (
        <>
          <form className="user-search-form" onSubmit={handleSearchSubmit}>
            <label className="user-search-label" htmlFor="user-search">
              유저 검색
            </label>
            <div className="user-search-box">
              <input
                id="user-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="닉네임 또는 유저 ID 검색"
              />
              <button type="submit" aria-label="검색">
                <SearchIcon />
              </button>
            </div>
          </form>

          {hasSearched ? (
            <>
              <div className="event-table-panel user-table-panel">
                <table className="event-table user-table">
                  <thead>
                    <tr>
                      {userColumns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableMessageRow colSpan={userColumns.length}>로딩 중...</TableMessageRow>
                    ) : users.length === 0 ? (
                      <TableMessageRow colSpan={userColumns.length}>검색 결과가 없습니다.</TableMessageRow>
                    ) : (
                      users.map((user) => (
                        <tr key={user.userId} className="event-row">
                          <td>
                            <span className="user-id-text">U-{user.userId}</span>
                          </td>
                          <td>{user.nickName}</td>
                          <td>{formatProvider(user.oauthProvider)}</td>
                          <td>{formatIsoDate(user.joinedAt)}</td>
                          <td>
                            <UserStateChip state={user.accountState} />
                          </td>
                          <td>{user.reportedCount}</td>
                          <td>
                            <button className="table-action-button" onClick={() => void openUserDetail(user.userId)} type="button">
                              상세 보기
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                className="user-pagination"
                currentPage={currentPage}
                totalPages={totalPages}
                onChange={(page) => void fetchUsers(appliedSearchQuery, page)}
              />
            </>
          ) : null}
        </>
      )}

      {errorMessage ? <p className="login-message">{errorMessage}</p> : null}

      {contentDeleteTarget && selectedUser ? (
        <ContentDeleteModal
          nickName={selectedUser.nickName}
          content={contentDeleteTarget}
          saving={saving}
          onClose={closeContentDeleteModal}
          onConfirm={(memo) =>
            void submitSanction(
              {
                type: 'CONTENT_DELETED',
                targetType: contentDeleteTarget.type,
                targetId: contentDeleteTarget.contentId,
                memo: memo || undefined,
              },
              '콘텐츠 삭제',
              () => setContentDeleteTarget(null),
            )
          }
        />
      ) : null}

      {showAccountSanctionModal ? (
        <AccountSanctionModal
          saving={saving}
          onClose={closeAccountSanctionModal}
          onConfirm={(action, memo) =>
            void submitSanction(
              { type: action, targetType: null, targetId: null, memo: memo || undefined },
              '계정 제재',
              () => setShowAccountSanctionModal(false),
            )
          }
        />
      ) : null}
    </div>
  )
}
