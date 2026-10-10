import type { AdminUserContent, AdminUserDetail, AdminUserSanction } from '@/lib/api/user.api'
import { formatIsoDate } from '@/lib/utils/date-format'
import { contentTypeLabels, formatProvider, sanctionTypeLabels } from '../lib/user-labels'
import { UserStateChip } from './UserStateChip'

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="user-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="activity-stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

type UserDetailCardProps = {
  user: AdminUserDetail
  contents: AdminUserContent[]
  sanctions: AdminUserSanction[]
  loading: boolean
  onBack: () => void
  onDeleteContent: (content: AdminUserContent) => void
  onSanctionAccount: () => void
}

/** 유저 상세: 기본 정보 / 활동 통계 / 제재 이력 / 최근 콘텐츠 */
export function UserDetailCard({
  user,
  contents,
  sanctions,
  loading,
  onBack,
  onDeleteContent,
  onSanctionAccount,
}: UserDetailCardProps) {
  return (
    <section className="user-detail-card">
      <button className="user-breadcrumb" onClick={onBack} type="button">
        유저 관리 &gt; 상세
      </button>

      <section>
        <h2>기본 정보</h2>
        <div className="user-info-list">
          <DetailItem label="닉네임" value={user.nickName} />
          <DetailItem label="소셜 로그인" value={formatProvider(user.oauthProvider)} />
          <DetailItem label="가입일" value={formatIsoDate(user.joinedAt)} />
          <div className="user-info-row">
            <span>계정 상태</span>
            <strong>
              <UserStateChip state={user.accountState} />
            </strong>
          </div>
        </div>
      </section>

      {loading ? <p className="login-message">상세 정보를 불러오는 중...</p> : null}

      <div className="user-detail-grid">
        <section>
          <h2>활동 통계</h2>
          <div className="activity-stat-grid">
            <StatCard label="피드" value={user.activityStats.boardCount} />
            <StatCard label="댓글" value={user.activityStats.replyCount} />
            <StatCard label="토픽룸 참여" value={user.activityStats.topicRoomParticipationCount} />
            <StatCard label="피신고 횟수" value={user.activityStats.reportedCount} />
          </div>
        </section>

        <section>
          <h2>제재 이력</h2>
          <table className="compact-user-table">
            <thead>
              <tr>
                <th>일자</th>
                <th>조치</th>
                <th>코멘트</th>
              </tr>
            </thead>
            <tbody>
              {sanctions.length === 0 ? (
                <tr>
                  <td colSpan={3}>제재 이력이 없습니다.</td>
                </tr>
              ) : (
                sanctions.map((sanction) => (
                  <tr key={sanction.sanctionId}>
                    <td>{formatIsoDate(sanction.createdAt)}</td>
                    <td>{sanctionTypeLabels[sanction.type] ?? sanction.type}</td>
                    <td>{sanction.memo || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>

      <section className="recent-content-section">
        <h2>최근 작성 콘텐츠</h2>
        <div className="recent-content-list">
          {contents.length === 0 ? (
            <p className="empty-note">최근 작성 콘텐츠가 없습니다.</p>
          ) : (
            contents.map((content) => (
              <div className="recent-content-row" key={`${content.type}-${content.contentId}`}>
                <span className="content-type-chip">{contentTypeLabels[content.type] ?? content.type}</span>
                <p>{content.content}</p>
                <button className="black-action-button" onClick={() => onDeleteContent(content)} type="button">
                  삭제
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="user-detail-actions">
        <button className="btn-primary" onClick={onSanctionAccount} type="button">
          계정 제재
        </button>
      </div>
    </section>
  )
}
