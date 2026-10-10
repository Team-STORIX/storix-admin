/**
 * `data`(JSON) + `file` 조합의 multipart 본문을 만든다.
 * 배너/팝업처럼 이미지 파일을 함께 올리는 관리자 API에서 공통으로 사용한다.
 */
export function buildMultipartBody(data: unknown, file?: File | null): FormData {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (file) {
    formData.append('file', file)
  }
  return formData
}
