'use client'

import { FormEvent, useState } from 'react'
import type { AdminBanner, AdminBannerPayload, BannerContentTargetType } from '@/lib/api/banner.api'
import { FormModal } from '@/components/admin/Modal'
import { Field, SelectField, TextField } from '@/components/admin/FormField'
import { buildBannerPayload, emptyBannerForm, toBannerFormState, type BannerFormState } from '../lib/banner-form'

const targetTypeOptions: Array<{ value: BannerContentTargetType; label: string }> = [
  { value: 'APP_EVENT', label: '앱 이벤트' },
]

type BannerFormModalProps = {
  editingBanner: AdminBanner | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: AdminBannerPayload, file: File | null) => Promise<void>
}

export function BannerFormModal({ editingBanner, saving, onClose, onSubmit }: BannerFormModalProps) {
  const [form, setForm] = useState<BannerFormState>(() =>
    editingBanner ? toBannerFormState(editingBanner) : emptyBannerForm,
  )
  const isEdit = editingBanner !== null

  const patchForm = (patch: Partial<BannerFormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = buildBannerPayload(form, isEdit ? 'edit' : 'create')
    if (!result.ok) {
      alert(result.message)
      return
    }

    void onSubmit(result.value.payload, result.value.file)
  }

  return (
    <FormModal
      title={isEdit ? '배너 수정' : '새 배너 만들기'}
      description="연결할 앱 이벤트, 노출 기간과 배너 이미지를 입력합니다."
      submitLabel={isEdit ? '수정 완료' : '배너 생성'}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        label="연결 앱 이벤트 ID"
        type="number"
        value={form.targetId}
        onChange={(targetId) => patchForm({ targetId })}
      />
      <SelectField<BannerContentTargetType>
        label="대상 유형"
        value={form.contentTargetType}
        onChange={(contentTargetType) => patchForm({ contentTargetType })}
        options={targetTypeOptions}
      />
      <TextField label="배너명" value={form.bannerTitle} onChange={(bannerTitle) => patchForm({ bannerTitle })} />
      <TextField
        label="노출 시작"
        type="datetime-local"
        value={form.displayStartAt}
        onChange={(displayStartAt) => patchForm({ displayStartAt })}
      />
      <TextField
        label="노출 종료"
        type="datetime-local"
        value={form.displayEndAt}
        onChange={(displayEndAt) => patchForm({ displayEndAt })}
      />
      <Field label={isEdit ? '이미지 변경' : '배너 이미지'}>
        <input
          type="file"
          accept="image/*"
          onChange={(event) => patchForm({ file: event.target.files?.[0] ?? null })}
        />
      </Field>
    </FormModal>
  )
}
