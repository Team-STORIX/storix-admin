'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminLogin } from '@/lib/api/auth.api'
import { getApiErrorMessage } from '@/lib/api/errors'
import { storeAccessToken } from '@/lib/auth/access-token'

const LOGIN_FAILED_MESSAGE = '로그인에 실패했습니다.\n이메일과 비밀번호를 확인해주세요.'

export default function Home() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await adminLogin({ email, password })

      if (response.isSuccess && response.result.accessToken) {
        // 액세스 토큰은 localStorage(요청 헤더) + 쿠키(미들웨어 체크)에 저장한다.
        // 리프레시 토큰은 서버가 내려주는 쿠키로 자동 저장됨 (withCredentials: true)
        storeAccessToken(response.result.accessToken)
        router.push('/home')
      } else {
        setError(response.message || '로그인에 실패했습니다.')
      }
    } catch (err) {
      console.error('로그인 실패:', err)
      setError(getApiErrorMessage(err, LOGIN_FAILED_MESSAGE))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="관리자 로그인">
        <div className="welcome-copy">
          <h1>
            Welcome!
            <span>Team STORIX</span>
          </h1>
          <img className="login-logo" src="/storix-logo-pink.svg" alt="STORIX" />
        </div>

        <div className="login-divider" />

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>관리자 로그인</h2>
          <label>
            <span>이메일</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email"
              type="email"
              autoComplete="username"
              required
              disabled={isLoading}
            />
          </label>
          <label>
            <span>비밀번호</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
          {error && <p className="login-message">{error}</p>}
        </form>
      </section>
    </main>
  )
}
