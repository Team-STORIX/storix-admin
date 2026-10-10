'use client'

import { FormEvent, useState } from 'react'
import type {
  AdminNotificationPayload,
  NotificationTargetType,
  NotificationType,
  SendType,
  TargetAudience,
} from '@/lib/api/notification.api'
import { MARKETING_PUSH_TIME_LABEL } from '@/lib/utils/notification-rules'
import { FormModal } from '@/components/admin/Modal'
import { ChoiceField, labelsToOptions, SelectField, TextAreaField, TextField } from '@/components/admin/FormField'
import {
  buildPushPayload,
  emptyPushForm,
  notificationTargetTypeOptions,
  notificationTypeLabels,
  sendTypeLabels,
  targetAudienceLabels,
  type PushFormState,
} from '../lib/push-form'

const notificationTypeOptions = labelsToOptions(notificationTypeLabels)
const targetAudienceOptions = labelsToOptions(targetAudienceLabels)
const sendTypeOptions = labelsToOptions(sendTypeLabels)

type PushFormModalProps = {
  /** 쿼리스트링 등으로 미리 채운 초기값 */
  initialForm?: PushFormState
  saving: boolean
  onClose: () => void
  onSubmit: (payload: AdminNotificationPayload) => Promise<void>
}

export function PushFormModal({ initialForm, saving, onClose, onSubmit }: PushFormModalProps) {
  const [form, setForm] = useState<PushFormState>(initialForm ?? emptyPushForm)

  const patchForm = (patch: Partial<PushFormState>) =>
    setForm((current) => ({ ...current, ...patch }))

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const result = buildPushPayload(form)
    if (!result.ok) {
      alert(result.message)
      return
    }

    void onSubmit(result.value)
  }

  const handleTargetTypeChange = (targetType: NotificationTargetType) => {
    setForm((current) => ({
      ...current,
      targetType,
      eventTargetId:
        targetType === 'APP_EVENT' || current.targetAudience === 'EVENT_WINNERS' ? current.eventTargetId : '',
      targetLink: targetType === 'EXTERNAL' ? current.targetLink : '',
    }))
  }

  const handleSendTypeChange = (sendType: SendType) => {
    setForm((current) => ({
      ...current,
      sendType,
      scheduledAt: sendType === 'IMMEDIATE' ? '' : current.scheduledAt,
    }))
  }

  return (
    <FormModal
      title="새 알림 만들기"
      description="알림 내용과 발송 방식, 이동 타겟을 입력합니다."
      submitLabel="알림 생성"
      saving={saving}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <TextField
        label="알림 제목"
        placeholder="푸시 알림 제목 입력"
        value={form.title}
        onChange={(title) => patchForm({ title })}
      />
      <TextAreaField
        label="알림 내용"
        placeholder="푸시 알림 세부 설명"
        value={form.content}
        onChange={(content) => patchForm({ content })}
      />
      <ChoiceField<NotificationType>
        label="알림 유형"
        value={form.notificationType}
        onChange={(notificationType) => patchForm({ notificationType })}
        options={notificationTypeOptions}
      />
      <SelectField<NotificationTargetType>
        label="이동 대상"
        value={form.targetType}
        onChange={handleTargetTypeChange}
        options={notificationTargetTypeOptions}
      />
      {form.targetType === 'APP_EVENT' ? (
        <TextField
          label="연결 앱 이벤트 ID"
          inputMode="numeric"
          value={form.eventTargetId}
          onChange={(eventTargetId) => patchForm({ eventTargetId })}
          placeholder="appEventId 입력"
        />
      ) : null}
      {form.targetType === 'EXTERNAL' ? (
        <TextField
          label="외부 URL"
          type="url"
          value={form.targetLink}
          onChange={(targetLink) => patchForm({ targetLink })}
          placeholder="https://..."
        />
      ) : null}
      <ChoiceField<TargetAudience>
        label="발송 대상"
        value={form.targetAudience}
        onChange={(targetAudience) => patchForm({ targetAudience })}
        options={targetAudienceOptions}
      />
      {form.targetAudience === 'EVENT_WINNERS' && form.targetType !== 'APP_EVENT' ? (
        <TextField
          label="당첨자 대상 이벤트 ID"
          inputMode="numeric"
          value={form.eventTargetId}
          onChange={(eventTargetId) => patchForm({ eventTargetId })}
          placeholder="appEventId 입력"
        />
      ) : null}
      <ChoiceField<SendType>
        label="발송 방식"
        value={form.sendType}
        onChange={handleSendTypeChange}
        options={sendTypeOptions}
      />
      {form.notificationType === 'MARKETING' ? (
        <p className="marketing-push-notice">
          마케팅 푸시는 한국 시간 기준 {MARKETING_PUSH_TIME_LABEL}에만 발송할 수 있습니다. 즉시 발송도 같은 제한이 적용됩니다.
        </p>
      ) : null}
      {form.sendType === 'SCHEDULED' ? (
        <TextField
          label="예약 발송 일시"
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(scheduledAt) => patchForm({ scheduledAt })}
        />
      ) : null}
    </FormModal>
  )
}
