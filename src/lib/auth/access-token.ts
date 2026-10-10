/**
 * 액세스 토큰 저장소.
 * - localStorage: axios 요청 인터셉터가 Authorization 헤더로 사용
 * - cookie: Next.js 미들웨어가 로그인 여부 판단에 사용
 */
const ACCESS_TOKEN_KEY = 'accessToken'
const ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7

export function readAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function storeAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  document.cookie = `${ACCESS_TOKEN_KEY}=${token}; path=/; max-age=${ACCESS_TOKEN_COOKIE_MAX_AGE}; SameSite=Lax`
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`
}
