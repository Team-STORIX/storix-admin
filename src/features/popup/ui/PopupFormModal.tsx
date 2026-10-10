'use client'

import { FormEvent, useState } from 'react'
import type { AdminPopup, AdminPopupPayload, PopupContentTargetType, PopupExposurePolicy } from '@/lib/api/popup.api'
import { FormModal } from '@/components/admin/Modal'
import { Field, labelsToOptions, SelectField, TextField } from '@/components/admin/FormField'
import {
  buildPopupPayload,
  emptyPopupForm,
  popupExposurePolicyLabels,
  popupTargetTypeLabels,
  toPopupFormState,
  type PopupFormState,
} from '../lib/popup-form'

const targetTypeOptions = labelsToOptions(popupTargetTypeLabels)
const exposurePolicyOptions = labelsToOptions(popupExposurePolicyLabels)

type PopupFormModalProps = {
  editingPopup: AdminPopup | null
  saving: boolean
  onClose: () => void
  onSubmit: (payload: AdminPopupPayload, file: File | null) => Promise<void>
}

export function PopupFormModal({ editingPopup, saving, onClose, onSubmit }: PopupFormModalProps) {
  const [form, setForm] = useState<PopupFormState>(() =>
    editingPopup ? toPopupFormState(editingPopup) : emptyPopupForm,
  )
  const isEdit = editingPopup !== null

  const patchForm = (patch: Partial<PopupFormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = buildPopupPayload(form, isEdit ? 'edit' : 'create')
    if (!result.ok) {
      alert(result.message)
      return
    }

    void onSubmit(result.value.payload, result.value.file)
  }

  return (
    <FormModal
      title={isEdit ? '팝업 수정' : '새 팝업 만들기'}
      submitLabel={isEdit ? '수정 완료' : '팝업 생성'}
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        label="연결 앱 이벤트 ID"
        inputMode="numeric"
        placeholder="appEventId 입력"
        value={form.targetId}
        onChange={(targetId) => patchForm({ targetId })}
      />
      <SelectField<PopupContentTargetType>
        label="연결 대상"
        value={form.contentTargetType}
        onChange={(contentTargetType) => patchForm({ contentTargetType })}
        options={targetTypeOptions}
      />
      <SelectField<PopupExposurePolicy>
        label="노출 정책"
        value={form.exposurePolicy}
        onChange={(exposurePolicy) => patchForm({ exposurePolicy })}
        options={exposurePolicyOptions}
      />
      <TextField
        label="제목"
        placeholder="관리용 팝업 제목 입력"
        value={form.popupTitle}
        onChange={(popupTitle) => patchForm({ popupTitle })}
      />
      <Field label="이미지" className="popup-image-field">
        <div className="popup-upload-box">
          <input
            type="file"
            accept="image/*"
            onChange={(event) => patchForm({ file: event.target.files?.[0] ?? null })}
          />
          <div className="popup-upload-placeholder">
            <span>+</span>
            <small>{form.file ? form.file.name : '이미지 업로드 (drag & drop)'}</small>
          </div>
        </div>
      </Field>
      <TextField
        label="내용"
        placeholder="팝업 내용 입력"
        value={form.content}
        onChange={(content) => patchForm({ content })}
      />
      <TextField
        label="CTA"
        placeholder="CTA 버튼 문구 입력"
        value={form.ctaText}
        onChange={(ctaText) => patchForm({ ctaText })}
      />
      <TextField
        label="시작일"
        type="datetime-local"
        value={form.displayStartAt}
        onChange={(displayStartAt) => patchForm({ displayStartAt })}
      />
      <TextField
        label="종료일"
        type="datetime-local"
        value={form.displayEndAt}
        onChange={(displayEndAt) => patchForm({ displayEndAt })}
      />
    </FormModal>
  )
}
