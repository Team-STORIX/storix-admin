'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getAdminProfile } from '@/lib/api/auth.api'

type MenuItem = {
  href: string
  label: string
  icon: string
  children?: Array<{ href: string; label: string }>
}

const menuItems: MenuItem[] = [
  {
    href: '/event/in-app',
    label: '인앱 이벤트 관리',
    icon: 'E',
    children: [
      { href: '/event/push', label: '푸시 알림 관리' },
      { href: '/event/popup', label: '팝업(=모달) 관리' },
      { href: '/event/banner', label: '배너 관리' },
    ],
  },
  { href: '/report', label: '신고 관리', icon: 'R' },
  { href: '/user', label: '유저 관리', icon: 'U' },
]

const profileImages: Record<string, string> = {
  황수연: '/profiles/atang.png',
  김윤성: '/profiles/bini.png',
  정해인: '/profiles/hae.png',
  이채연: '/profiles/mung.webp',
  정은선: '/profiles/silver.webp',
  이수아: '/profiles/soo.png',
  이윤지: '/profiles/yoon.webp',
  허유진: '/profiles/yu.webp',
}

export function Sidebar() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<{
    nickName: string
    email: string
  } | null>(null)

  useEffect(() => {
    let mounted = true

    getAdminProfile()
      .then((response) => {
        if (mounted && response.isSuccess) {
          setProfile(response.result)
        }
      })
      .catch(() => {
        if (mounted) {
          setProfile(null)
        }
      })

    return () => {
      mounted = false
    }
  }, [])

  const profileImage = profile?.nickName ? profileImages[profile.nickName] : undefined

  return (
    <aside className="admin-sidebar">
      <div>
        <Link className="sidebar-title" href="/home">
          <img src="/storix-logo-pink.svg" alt="" aria-hidden="true" />
          <span>홈</span>
        </Link>

        <nav className="sidebar-nav" aria-label="관리자 메뉴">
          {menuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0
            const isActive = pathname === item.href
            const hasActiveChild = hasChildren
              ? item.children!.some((child) => pathname === child.href)
              : false

            return (
              <div key={item.label} className="sidebar-menu-item">
                <Link
                  className={`sidebar-menu-link ${isActive || hasActiveChild ? 'active' : ''}`}
                  href={item.href}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  {item.label}
                </Link>
                {hasChildren ? (
                  <div className="sidebar-submenu">
                    {item.children!.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          className={`sidebar-submenu-link ${isChildActive ? 'active' : ''}`}
                          href={child.href}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="sidebar-profile">
        {profileImage ? (
          <img className="sidebar-profile-image" src={profileImage} alt="" aria-hidden="true" />
        ) : null}
        <div className="sidebar-profile-info">
          <strong>{profile?.nickName ?? '관리자'}</strong>
          <span>{profile?.email ?? '프로필 조회 중'}</span>
        </div>
      </div>
    </aside>
  )
}
