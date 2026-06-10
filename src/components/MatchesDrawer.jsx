import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, MessageCircle, Sparkles, X } from 'lucide-react'
import { supabase } from '../supabaseClient'

function formatTimeLabel(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const now = new Date()
  const sameDay = date.toDateString() === now.toDateString()

  if (sameDay) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleDateString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  })
}

function mapPeerProfile(profile) {
  if (!profile) {
    return null
  }

  return {
    ...profile,
    name: profile.nickname,
    image:
      profile.avatar_url?.trim() ||
      `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile.nickname || 'peer')}`,
  }
}

export default function MatchesDrawer({ currentUserId, open, onClose, onOpenChat }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!open || !currentUserId) {
      return
    }

    let active = true

    const loadMatches = async () => {
      setIsLoading(true)
      setErrorMessage('')

      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, user_a, user_b, created_at')
        .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (!active) {
        return
      }

      if (matchesError) {
        setItems([])
        setErrorMessage(matchesError.message)
        setIsLoading(false)
        return
      }

      if (!matches || matches.length === 0) {
        setItems([])
        setIsLoading(false)
        return
      }

      const peerIds = matches.map((match) => (match.user_a === currentUserId ? match.user_b : match.user_a))
      const matchIds = matches.map((match) => match.id)

      const [{ data: profiles, error: profilesError }, { data: messages, error: messagesError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nickname, age, avatar_url, bio, interests')
          .in('id', peerIds),
        supabase
          .from('messages')
          .select('id, match_id, sender_id, text, created_at')
          .in('match_id', matchIds)
          .order('created_at', { ascending: false }),
      ])

      if (!active) {
        return
      }

      if (profilesError) {
        setItems([])
        setErrorMessage(profilesError.message)
        setIsLoading(false)
        return
      }

      if (messagesError) {
        setItems([])
        setErrorMessage(messagesError.message)
        setIsLoading(false)
        return
      }

      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, mapPeerProfile(profile)]))
      const latestMessageMap = new Map()

      for (const message of messages ?? []) {
        if (!latestMessageMap.has(message.match_id)) {
          latestMessageMap.set(message.match_id, message)
        }
      }

      const nextItems = matches
        .map((match) => {
          const peerId = match.user_a === currentUserId ? match.user_b : match.user_a
          const peerProfile = profileMap.get(peerId)

          if (!peerProfile) {
            return null
          }

          return {
            match,
            peerProfile,
            latestMessage: latestMessageMap.get(match.id) ?? null,
          }
        })
        .filter(Boolean)

      setItems(nextItems)
      setIsLoading(false)
    }

    loadMatches()

    return () => {
      active = false
    }
  }, [currentUserId, open])

  const titleText = useMemo(() => `${items.length} 个匹配 / 会话`, [items.length])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-[2px]">
      <button type="button" aria-label="关闭会话抽屉" className="flex-1" onClick={onClose} />

      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/60 bg-white/92 shadow-2xl shadow-pink-100 backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-pink-100 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-500">
              <Sparkles className="h-3.5 w-3.5" />
              会话列表
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{titleText}</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-500 transition hover:bg-pink-50 hover:text-pink-500"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin text-pink-400" />
                正在读取会话列表...
              </div>
            </div>
          ) : errorMessage ? (
            <div className="rounded-[28px] border border-rose-100 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-500">
              读取匹配列表失败：{errorMessage}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-sm rounded-[28px] border border-pink-100 bg-pink-50/70 px-6 py-5 text-center text-sm leading-7 text-slate-500">
                还没有可进入的匹配会话。先去卡片页点几次喜欢，双向匹配成功后就会出现在这里。
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ match, peerProfile, latestMessage }) => {
                const previewText = latestMessage
                  ? `${latestMessage.sender_id === currentUserId ? '你：' : ''}${latestMessage.text}`
                  : '刚刚匹配成功，快去打个招呼吧。'

                const timeText = latestMessage?.created_at || match.created_at

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      onOpenChat?.({
                        profile: peerProfile,
                        match,
                      })
                      onClose?.()
                    }}
                    className="flex w-full items-start gap-3 rounded-[28px] border border-pink-100 bg-white px-4 py-4 text-left shadow-sm transition hover:border-pink-200 hover:bg-pink-50/50"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
                      <img src={peerProfile.image} alt={`${peerProfile.nickname} 的头像`} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{peerProfile.nickname}</p>
                        <span className="shrink-0 text-xs text-slate-400">{formatTimeLabel(timeText)}</span>
                      </div>

                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500">{previewText}</p>

                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-500">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Match #{match.id}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
