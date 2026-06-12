import { Compass, Heart, MessageCircle, Sparkles, UserRound } from 'lucide-react'

const TAB_CONFIG = {
  cards: {
    label: '缘分',
    icon: Heart,
  },
  radar: {
    label: '雷达',
    icon: Compass,
  },
  community: {
    label: '动态',
    icon: Sparkles,
  },
  messages: {
    label: '消息',
    icon: MessageCircle,
  },
  me: {
    label: '我的',
    icon: UserRound,
  },
}

export default function BottomTabBar({ activeTab, onChange, unreadCount = 0 }) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
      <div className="pointer-events-auto flex w-full max-w-4xl items-center justify-between rounded-[30px] border border-white/70 bg-white/88 px-3 py-3 shadow-[0_24px_80px_rgba(244,114,182,0.18)] backdrop-blur-xl">
        {Object.entries(TAB_CONFIG).map(([key, config]) => {
          const isActive = activeTab === key
          const Icon = config.icon
          const badgeCount = key === 'messages' ? unreadCount : 0

          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange?.(key)}
              className={`relative flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-[22px] px-3 py-2.5 text-xs font-medium transition ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-[0_16px_32px_rgba(244,114,182,0.3)]'
                  : 'text-slate-500 hover:bg-pink-50 hover:text-pink-500'
              }`}
            >
              <span className="relative">
                <Icon className="h-[18px] w-[18px]" />
                {badgeCount > 0 && (
                  <span className="absolute -right-3 -top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </span>
              <span>{config.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
