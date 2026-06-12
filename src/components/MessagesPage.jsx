import { useEffect, useMemo, useState } from 'react'
import { LoaderCircle, MessageCircle, Sparkles } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { getLastReadAt } from '../utils/chatReadState'
import VerifiedBadge from './VerifiedBadge'

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

function formatSecondaryTimeLabel(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const now = new Date()
  const diff = now.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)
  const oneDay = 24 * 60 * 60 * 1000

  if (diff === 0) {
    return '今天活跃'
  }

  if (diff === oneDay) {
    return '昨天活跃'
  }

  return `${formatTimeLabel(value)} 活跃`
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

export default function MessagesPage({ currentUserId, onOpenChat, onUnreadCountChange }) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!currentUserId) {
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
        onUnreadCountChange?.(0)
        return
      }

      if (!matches || matches.length === 0) {
        setItems([])
        setIsLoading(false)
        onUnreadCountChange?.(0)
        return
      }

      const peerIds = matches.map((match) => (match.user_a === currentUserId ? match.user_b : match.user_a))
      const matchIds = matches.map((match) => match.id)

      const [{ data: profiles, error: profilesError }, { data: messages, error: messagesError }] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nickname, age, avatar_url, bio, interests, is_verified')
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
        onUnreadCountChange?.(0)
        return
      }

      if (messagesError) {
        setItems([])
        setErrorMessage(messagesError.message)
        setIsLoading(false)
        onUnreadCountChange?.(0)
        return
      }

      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, mapPeerProfile(profile)]))
      const messagesByMatchId = new Map()

      for (const message of messages ?? []) {
        const group = messagesByMatchId.get(message.match_id) ?? []
        group.push(message)
        messagesByMatchId.set(message.match_id, group)
      }

      const nextItems = matches
        .map((match) => {
          const peerId = match.user_a === currentUserId ? match.user_b : match.user_a
          const peerProfile = profileMap.get(peerId)

          if (!peerProfile) {
            return null
          }

          const matchMessages = messagesByMatchId.get(match.id) ?? []
          const latestMessage = matchMessages[0] ?? null
          const lastReadAt = getLastReadAt(currentUserId, match.id)
          const unreadCount = matchMessages.filter(
            (message) => message.sender_id !== currentUserId && (!lastReadAt || message.created_at > lastReadAt),
          ).length

          return {
            match,
            peerProfile,
            latestMessage,
            unreadCount,
            lastActiveAt: latestMessage?.created_at || match.created_at,
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime())

      setItems(nextItems)
      setIsLoading(false)
      onUnreadCountChange?.(nextItems.reduce((sum, item) => sum + item.unreadCount, 0))
    }

    loadMatches()

    return () => {
      active = false
    }
  }, [currentUserId, onUnreadCountChange])

  const titleText = useMemo(() => `${items.length} 个匹配 / 会话`, [items.length])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.18),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_52%,_#fff5f7_100%)] px-4 pb-32 pt-8">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-5xl flex-col rounded-[36px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur-xl">
        <header className="border-b border-pink-100 px-5 py-5 md:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3.5 py-1.5 text-xs font-medium text-pink-500">
            <Sparkles className="h-3.5 w-3.5" />
            消息中心
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">消息</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            这里会显示双向喜欢后建立的所有会话，最新消息和未读状态会自动排序。
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
            <MessageCircle className="h-4 w-4 text-pink-400" />
            {titleText}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {isLoading ? (
            <div className="flex h-full min-h-[360px] items-center justify-center">
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
            <div className="flex h-full min-h-[360px] items-center justify-center">
              <div className="max-w-sm rounded-[28px] border border-pink-100 bg-pink-50/70 px-6 py-5 text-center text-sm leading-7 text-slate-500">
                还没有可进入的匹配会话。先去『缘分』里点几次喜欢，双向匹配成功后就会出现在这里。
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(({ match, peerProfile, latestMessage, unreadCount, lastActiveAt }) => {
                const previewText = latestMessage
                  ? `${latestMessage.sender_id === currentUserId ? '你：' : ''}${latestMessage.text}`
                  : '刚刚匹配成功，快去打个招呼吧。'

                return (
                  <button
                    key={match.id}
                    type="button"
                    onClick={() => {
                      onOpenChat?.({
                        profile: peerProfile,
                        match,
                      })
                    }}
                    className="flex w-full items-start gap-3 rounded-[28px] border border-pink-100 bg-white px-4 py-4 text-left shadow-sm transition hover:border-pink-200 hover:bg-pink-50/50"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
                      <img src={peerProfile.image} alt={`${peerProfile.nickname} 的头像`} className="h-full w-full object-cover" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">{peerProfile.nickname}</p>
                          {peerProfile.is_verified && <VerifiedBadge compact />}
                          {unreadCount > 0 && (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow-sm">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </div>
                        <span className={`shrink-0 text-xs ${unreadCount > 0 ? 'font-medium text-pink-500' : 'text-slate-400'}`}>
                          {formatTimeLabel(lastActiveAt)}
                        </span>
                      </div>

                      <p className={`mt-1 line-clamp-2 text-sm leading-6 ${unreadCount > 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                        {previewText}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3 py-1 text-xs font-medium text-pink-500">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Match #{match.id}
                        </div>
                        <span className="text-xs text-slate-400">{formatSecondaryTimeLabel(lastActiveAt)}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
