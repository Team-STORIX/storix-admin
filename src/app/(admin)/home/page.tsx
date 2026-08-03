'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

const profileImages = [
  '/profiles/atang.png',
  '/profiles/bini.png',
  '/profiles/hae.png',
  '/profiles/mung.webp',
  '/profiles/silver.webp',
  '/profiles/soo.png',
  '/profiles/yoon.webp',
  '/profiles/yu.webp',
]

type Sprite = {
  src: string
  x: number
  y: number
  width: number
  height: number
  vx: number
  vy: number
}

const IMAGE_HEIGHT = 120
const DEFAULT_IMAGE_WIDTH = 90
const MIN_SPEED = 0.6
const MAX_SPEED = 1.4
const COLLISION_PADDING = 4

const shuffle = (items: string[]) => {
  const nextItems = [...items]
  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[nextItems[index], nextItems[randomIndex]] = [nextItems[randomIndex], nextItems[index]]
  }
  return nextItems
}

const randomVelocity = () => {
  const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED)
  return Math.random() > 0.5 ? speed : -speed
}

const getImageWidth = (src: string) =>
  new Promise<[string, number]>((resolve) => {
    const image = new Image()
    image.onload = () => {
      const ratio = image.naturalWidth / image.naturalHeight
      resolve([src, Math.max(1, Math.round(IMAGE_HEIGHT * ratio))])
    }
    image.onerror = () => resolve([src, DEFAULT_IMAGE_WIDTH])
    image.src = src
  })

const createSprites = (
  images: string[],
  width: number,
  height: number,
  imageWidths: Record<string, number>,
): Sprite[] => {
  const placedSprites: Sprite[] = []

  images.forEach((src, index) => {
    const spriteWidth = imageWidths[src] ?? DEFAULT_IMAGE_WIDTH
    const sprite: Sprite = {
      src,
      width: spriteWidth,
      height: IMAGE_HEIGHT,
      x: 0,
      y: 0,
      vx: randomVelocity(),
      vy: randomVelocity(),
    }

    const maxX = Math.max(0, width - spriteWidth)
    const maxY = Math.max(0, height - IMAGE_HEIGHT)
    let attempts = 0

    do {
      sprite.x = Math.min(maxX, 24 + ((index * 137 + attempts * 53) % Math.max(1, maxX)))
      sprite.y = Math.min(maxY, 24 + ((index * 91 + attempts * 67) % Math.max(1, maxY)))
      attempts += 1
    } while (attempts < 40 && placedSprites.some((placed) => hasOverlap(sprite, placed)))

    placedSprites.push(sprite)
  })

  return placedSprites
}

const hasOverlap = (a: Sprite, b: Sprite) =>
  a.x < b.x + b.width + COLLISION_PADDING &&
  a.x + a.width + COLLISION_PADDING > b.x &&
  a.y < b.y + b.height + COLLISION_PADDING &&
  a.y + a.height + COLLISION_PADDING > b.y

const clampSprite = (sprite: Sprite, width: number, height: number) => {
  sprite.x = Math.max(0, Math.min(sprite.x, width - sprite.width))
  sprite.y = Math.max(0, Math.min(sprite.y, height - sprite.height))
}

export default function HomePage() {
  const shuffledProfileImages = useMemo(() => shuffle(profileImages), [])
  const containerRef = useRef<HTMLDivElement>(null)
  const spritesRef = useRef<Sprite[]>([])
  const [sprites, setSprites] = useState<Sprite[]>([])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let isDisposed = false
    let animationFrame = 0
    let lastPaint = 0
    let imageWidths: Record<string, number> = {}

    const syncBounds = () => {
      const rect = container.getBoundingClientRect()
      if (spritesRef.current.length === 0) {
        spritesRef.current = createSprites(shuffledProfileImages, rect.width, rect.height, imageWidths)
        setSprites([...spritesRef.current])
        return
      }

      spritesRef.current = spritesRef.current.map((sprite) => ({
        ...sprite,
        x: Math.max(0, Math.min(sprite.x, rect.width - sprite.width)),
        y: Math.max(0, Math.min(sprite.y, rect.height - sprite.height)),
      }))
    }

    const animate = (time: number) => {
      const rect = container.getBoundingClientRect()
      const nextSprites = spritesRef.current.map((sprite) => ({ ...sprite }))

      nextSprites.forEach((sprite) => {
        sprite.x += sprite.vx
        sprite.y += sprite.vy

        if (sprite.x <= 0 || sprite.x + sprite.width >= rect.width) {
          sprite.x = Math.max(0, Math.min(sprite.x, rect.width - sprite.width))
          sprite.vx *= -1
        }

        if (sprite.y <= 0 || sprite.y + sprite.height >= rect.height) {
          sprite.y = Math.max(0, Math.min(sprite.y, rect.height - sprite.height))
          sprite.vy *= -1
        }
      })

      for (let index = 0; index < nextSprites.length; index += 1) {
        for (let nextIndex = index + 1; nextIndex < nextSprites.length; nextIndex += 1) {
          const a = nextSprites[index]
          const b = nextSprites[nextIndex]
          if (hasOverlap(a, b)) {
            const overlapX =
              Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) + COLLISION_PADDING
            const overlapY =
              Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y) + COLLISION_PADDING

            if (overlapX < overlapY) {
              const direction = a.x + a.width / 2 < b.x + b.width / 2 ? -1 : 1
              a.x += (overlapX / 2) * direction
              b.x -= (overlapX / 2) * direction
            } else {
              const direction = a.y + a.height / 2 < b.y + b.height / 2 ? -1 : 1
              a.y += (overlapY / 2) * direction
              b.y -= (overlapY / 2) * direction
            }

            ;[a.vx, b.vx] = [b.vx, a.vx]
            ;[a.vy, b.vy] = [b.vy, a.vy]
            clampSprite(a, rect.width, rect.height)
            clampSprite(b, rect.width, rect.height)
          }
        }
      }

      spritesRef.current = nextSprites

      if (time - lastPaint > 32) {
        setSprites([...nextSprites])
        lastPaint = time
      }

      animationFrame = requestAnimationFrame(animate)
    }

    Promise.all(shuffledProfileImages.map(getImageWidth)).then((entries) => {
      if (isDisposed) return
      imageWidths = Object.fromEntries(entries)
      syncBounds()
      window.addEventListener('resize', syncBounds)
      animationFrame = requestAnimationFrame(animate)
    })

    return () => {
      isDisposed = true
      window.removeEventListener('resize', syncBounds)
      cancelAnimationFrame(animationFrame)
    }
  }, [shuffledProfileImages])

  return (
    <div className="admin-home-page" ref={containerRef}>
      <div className="admin-home-bouncer-stage" aria-label="관리자 프로필 이미지">
        {sprites.map((sprite) => (
          <img
            key={sprite.src}
            src={sprite.src}
            alt=""
            aria-hidden="true"
            style={{
              width: `${sprite.width}px`,
              height: `${sprite.height}px`,
              transform: `translate3d(${sprite.x}px, ${sprite.y}px, 0)`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
