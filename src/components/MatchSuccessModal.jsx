import { useEffect, useMemo, useRef } from 'react'
import confetti from 'canvas-confetti'
import { Heart, MessageCircleHeart, Sparkles } from 'lucide-react'

export default function MatchSuccessModal({
  profile,
  currentUserProfile,
  matchRecord,
  onClose,
  onChat,
}) {
  const canvasRef = useRef(null)
  const myProfile = useMemo(
    () => ({
      name: currentUserProfile?.nickname || '你',
      image:
        currentUserProfile?.avatar_url ||
        `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
          currentUserProfile?.nickname || 'you',
        )}`,
    }),
    [currentUserProfile?.avatar_url, currentUserProfile?.nickname],
  )

  useEffect(() => {
    if (!profile || !canvasRef.current) {
      return undefined
    }

    const canvas = canvasRef.current
    const fire = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    })

    const heartShape =
      typeof confetti.shapeFromText === 'function'
        ? confetti.shapeFromText({ text: '❤', scalar: 1.9 })
        : undefined

    const sparkleShape =
      typeof confetti.shapeFromText === 'function'
        ? confetti.shapeFromText({ text: '✦', scalar: 1.6 })
        : undefined

    const timers = []

    const launchHearts = (originX, originY, spread) => {
      fire({
        particleCount: 30,
        spread,
        startVelocity: 42,
        decay: 0.94,
        gravity: 0.95,
        scalar: 1.15,
        ticks: 260,
        origin: { x: originX, y: originY },
        colors: ['#ff4d8d', '#ff7cb6', '#ffc1da', '#ffd9ea'],
        shapes: heartShape ? [heartShape] : ['circle'],
      })
    }

    const launchGold = (originX, originY, spread) => {
      fire({
        particleCount: 55,
        spread,
        startVelocity: 50,
        decay: 0.93,
        gravity: 1.02,
        scalar: 1.05,
        ticks: 230,
        origin: { x: originX, y: originY },
        colors: ['#ffd166', '#ffbe0b', '#ffe08a', '#fff0c2'],
        shapes: sparkleShape ? [sparkleShape] : ['square', 'circle'],
      })
    }

    const sequence = () => {
      launchHearts(0.5, 0.5, 110)
      launchGold(0.5, 0.48, 140)

      timers.push(
        window.setTimeout(() => {
          launchHearts(0.24, 0.34, 90)
          launchHearts(0.76, 0.34, 90)
          launchGold(0.18, 0.42, 125)
          launchGold(0.82, 0.42, 125)
        }, 180),
      )

      timers.push(
        window.setTimeout(() => {
          launchHearts(0.5, 0.22, 180)
          launchGold(0.5, 0.2, 180)
        }, 420),
      )

      timers.push(
        window.setTimeout(() => {
          launchHearts(0.34, 0.58, 100)
          launchHearts(0.66, 0.58, 100)
        }, 680),
      )
    }

    sequence()

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      fire.reset()
    }
  }, [profile])

  if (!profile) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(33,8,18,0.42)] px-4 py-6 backdrop-blur-xl">
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.35),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.28),_transparent_32%)]" />
      <div className="match-impact-glow absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400/20 blur-3xl" />
      <div className="match-ripple absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-300/60 bg-pink-300/10" />
      <div className="match-ripple match-ripple-delay-1 absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-rose-300/50 bg-rose-300/10" />
      <div className="match-ripple match-ripple-delay-2 absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-200/35 bg-pink-200/10" />

      <div className="match-modal-card relative w-full max-w-3xl overflow-hidden rounded-[40px] border border-white/60 bg-white/80 p-8 shadow-[0_40px_120px_rgba(236,72,153,0.28)] backdrop-blur-2xl md:p-12">
        <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-pink-200/55 blur-3xl" />
        <div className="absolute -bottom-12 right-0 h-48 w-48 rounded-full bg-rose-200/45 blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50/80 px-4 py-2 text-sm font-medium text-pink-500">
            <Sparkles className="h-4 w-4" />
            Match Success
          </div>

          <h2 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            恭喜！你们互相喜欢了对方！
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
            这是你们第一次双向心动。现在就可以开始聊天，或者先继续看看今天的其他缘分。
          </p>

          <div className="relative mt-10 flex items-center justify-center gap-4 md:gap-8">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/25 blur-2xl" />

            <div className="flex flex-col items-center">
              <div className="avatar-fly-left avatar-collision-shell h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl shadow-pink-200/70 md:h-36 md:w-36">
                <img src={myProfile.image} alt="我的头像" className="h-full w-full object-cover" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">{myProfile.name}</p>
            </div>

            <div className="flex flex-col items-center justify-center">
              <div className="match-heart-wrapper relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-pink-400/30 blur-xl" />
                <div className="heart-beat-strong relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-[0_16px_36px_rgba(244,114,182,0.4)]">
                  <Heart className="h-10 w-10 fill-current" />
                </div>
              </div>
              <span className="mt-3 text-sm font-medium text-pink-500">双向喜欢</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="avatar-fly-right avatar-collision-shell h-28 w-28 overflow-hidden rounded-full border-4 border-white shadow-xl shadow-pink-200/70 md:h-36 md:w-36">
                <img src={profile.image} alt={`${profile.name} 的头像`} className="h-full w-full object-cover" />
              </div>
              <p className="mt-3 text-sm font-medium text-slate-600">{profile.name}</p>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => onChat?.({ profile, matchRecord })}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3.5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(244,114,182,0.35)] transition hover:scale-[1.02] hover:opacity-95 sm:w-auto"
            >
              <MessageCircleHeart className="h-4 w-4" />
              发起聊天
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-full border border-pink-200 bg-white/85 px-6 py-3.5 text-sm font-medium text-slate-600 transition hover:border-pink-300 hover:text-pink-500 sm:w-auto"
            >
              继续寻缘
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
