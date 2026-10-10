import type { UserAccountState } from '@/lib/api/user.api'
import { accountStateDesigns } from '../lib/user-labels'

export function UserStateChip({ state }: { state: UserAccountState }) {
  const design = accountStateDesigns[state]
  return <span className={`user-state-chip ${design.className}`}>{design.label}</span>
}
