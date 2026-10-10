'use client'

import { FormEvent, useState } from 'react'
import type { AppEvent, AppEventPayload, AppEventType, PromotionType } from '@/lib/api/app-event.api'
import { FormModal } from '@/components/admin/Modal'
import { SelectField, TextField } from '@/components/admin/FormField'
import {
  buildAppEventPayload,
  emptyAppEventForm,
  emptyRewardRow,
  formatBoundaryHour,
  getEventBoundaryHour,
  toAppEventFormState,
  type AppEventFormState,
  type RewardRow,
} from '../lib/app-event-form'
import { eventTypeLabels, eventTypes, promotionDesigns, promotionTypes } from '../lib/app-event-labels'
import { DateTimeField } from './DateTimeField'

const eventTypeOptions = eventTypes.map((eventType) => ({ value: eventType, label: eventTypeLabels[eventType] }))

type AppEventFormModalProps = {
  /** 수정 대상. 없으면 생성 모드 */
  editingEvent: AppEvent | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: AppEventPayload) => Promise<void>
}

/** 앱 이벤트 생성/수정 폼. 검증과 payload 변환은 lib/app-event-form 에서 담당한다. */
export function AppEventFormModal({ editingEvent, saving, onClose, onSubmit }: AppEventFormModalProps) {
  const [form, setForm] = useState<AppEventFormState>(() =>
    editingEvent ? toAppEventFormState(editingEvent) : emptyAppEventForm,
  )
  const isEdit = editingEvent !== null
  const boundaryHour = getEventBoundaryHour(form.eventType)

  const patchForm = (patch: Partial<AppEventFormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = buildAppEventPayload(form)
    if (!result.ok) {
      alert(result.message)
      return
    }

    void onSubmit(result.value)
  }

  const togglePromotionType = (type: PromotionType) => {
    setForm((current) => ({
      ...current,
      promotionTypes: current.promotionTypes.includes(type)
        ? current.promotionTypes.filter((item) => item !== type)
        : [...current.promotionTypes, type],
    }))
  }

  const toggleHasWinner = (hasWinner: boolean) => {
    setForm((current) => ({
      ...current,
      hasWinner,
      rewardRows: hasWinner && current.rewardRows.length === 0 ? [emptyRewardRow()] : current.rewardRows,
    }))
  }

  const updateRewardRow = (index: number, field: keyof RewardRow, value: string) => {
    setForm((current) => ({
      ...current,
      rewardRows: current.rewardRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }))
  }

  const addRewardRow = () => {
    setForm((current) => ({ ...current, rewardRows: [...current.rewardRows, emptyRewardRow()] }))
  }

  const removeRewardRow = (index: number) => {
    setForm((current) => ({
      ...current,
      rewardRows: current.rewardRows.filter((_, rowIndex) => rowIndex !== index),
    }))
  }

  return (
    <FormModal
      title={isEdit ? '앱 이벤트 수정' : '새 앱 이벤트 만들기'}
      description="앱 이벤트 기본 정보와 연결할 홍보 수단을 입력합니다."
      submitLabel={isEdit ? '수정 완료' : '이벤트 생성'}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField label="이벤트명" value={form.name} onChange={(name) => patchForm({ name })} />
      <TextField label="설명" value={form.description} onChange={(description) => patchForm({ description })} />
      <SelectField<AppEventType>
        label="이벤트 유형"
        value={form.eventType}
        onChange={(eventType) => patchForm({ eventType })}
        options={eventTypeOptions}
      />
      <TextField
        label="페이지 키 (선택)"
        value={form.pageKey}
        maxLength={50}
        pattern="[a-z0-9-]*"
        placeholder="예: attendance-2026-08-17"
        onChange={(pageKey) => patchForm({ pageKey })}
      />
      <p className="filter-note">
        비워두면 이벤트 유형의 기본 화면을 사용합니다. 영소문자·숫자·하이픈만 입력할 수 있습니다.
      </p>
      <DateTimeField label="시작 일시" value={form.startAt} onChange={(startAt) => patchForm({ startAt })} />
      <DateTimeField label="종료 일시" value={form.endAt} onChange={(endAt) => patchForm({ endAt })} />
      {boundaryHour !== null ? (
        <p className="filter-note">
          {eventTypeLabels[form.eventType]} 이벤트는 시작·종료 시각을 {formatBoundaryHour(boundaryHour)}으로 입력해야 합니다. 종료 시각은 마지막 참여일 다음 경계입니다.
        </p>
      ) : null}

      <div className="promotion-selector" aria-label="홍보 수단 선택">
        <span>홍보 수단</span>
        {promotionTypes.map((type) => (
          <label key={type}>
            <input
              type="checkbox"
              checked={form.promotionTypes.includes(type)}
              onChange={() => togglePromotionType(type)}
            />
            {promotionDesigns[type].label}
          </label>
        ))}
      </div>

      <label className="action-checkbox">
        <input
          type="checkbox"
          checked={form.hasWinner}
          onChange={(event) => toggleHasWinner(event.target.checked)}
        />
        <div className="checkbox-content">
          <div className="checkbox-title">당첨자 안내 있음</div>
          <div className="checkbox-desc">이벤트 종료 후 당첨자 안내가 필요한 이벤트입니다.</div>
        </div>
      </label>

      {form.hasWinner ? (
        <div className="field wide">
          <span>이벤트 보상 설정</span>
          <div className="reward-row-list">
            {form.rewardRows.map((row, index) => (
              <div className="reward-row" key={index}>
                <input
                  inputMode="numeric"
                  placeholder="조건"
                  value={row.condition}
                  onChange={(event) => updateRewardRow(index, 'condition', event.target.value)}
                />
                <input
                  inputMode="numeric"
                  placeholder="보상값"
                  value={row.value}
                  onChange={(event) => updateRewardRow(index, 'value', event.target.value)}
                />
                <button className="table-action-button" onClick={() => removeRewardRow(index)} type="button">
                  삭제
                </button>
              </div>
            ))}
          </div>
          <button className="table-action-button" onClick={addRewardRow} type="button">
            보상 추가
          </button>
          {form.eventType === 'ATTENDANCE' ? (
            <p className="filter-note">비워두면 기본 지급표(3일 1개, 7일 2개, 12일 5개)가 적용됩니다.</p>
          ) : null}
        </div>
      ) : null}
    </FormModal>
  )
}
