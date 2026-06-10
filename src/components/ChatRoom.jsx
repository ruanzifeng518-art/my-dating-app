import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, SendHorizonal, Sparkles } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { setLastReadAt } from '../utils/chatReadState'

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ChatRoom({
  match,
  currentUserId,
  currentUserProfile,
  peerProfile,
  onBack,
}) {
  const [messages, setMessages] = useState([])
  const [pendingMessages, setPendingMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const viewportRef = useRef(null)
  const textareaRef = useRef(null)

  const matchId = match?.id
  const title = useMemo(() => peerProfile?.name || peerProfile?.nickname || '聊天室', [peerProfile])
  const avatar = useMemo(
    () =>
      peerProfile?.image ||
      peerProfile?.avatar_url ||
      `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(title || 'peer')}`,
    [peerProfile?.avatar_url, peerProfile?.image, title],
  )
  const renderedMessages = useMemo(
    () =>
      [...messages, ...pendingMessages].sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
      ),
    [messages, pendingMessages],
  )

  useEffect(() => {
    if (!textareaRef.current) {
      return
    }

    textareaRef.current.style.height = '0px'
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`
  }, [draft])

  useEffect(() => {
    if (!matchId) {
      return undefined
    }

    let active = true

    const loadMessages = async () => {
      setIsLoading(true)
      setErrorMessage('')

      const { data, error } = await supabase
        .from('messages')
        .select('id, match_id, sender_id, text, created_at')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true })

      if (!active) {
        return
      }

      if (error) {
        setMessages([])
        setErrorMessage(error.message)
        setIsLoading(false)
        return
      }

      setMessages(data ?? [])
      setIsLoading(false)
    }

    loadMessages()

    const channel = supabase
      .channel(`chat-room-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const nextMessage = payload.new
          setMessages((prev) => {
            if (prev.some((item) => item.id === nextMessage.id)) {
              return prev
            }

            return [...prev, nextMessage]
          })
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [matchId])

  useEffect(() => {
    if (!viewportRef.current) {
      return
    }

    viewportRef.current.scrollTop = viewportRef.current.scrollHeight
  }, [renderedMessages])

  useEffect(() => {
    if (!matchId || !currentUserId) {
      return
    }

    const latestVisibleTimestamp = messages[messages.length - 1]?.created_at || new Date().toISOString()
    setLastReadAt(currentUserId, matchId, latestVisibleTimestamp)
  }, [currentUserId, matchId, messages])

  const handleSend = async (event) => {
    event.preventDefault()

    const text = draft.trim()
    if (!text || !matchId || !currentUserId) {
      return
    }

    const pendingId = `pending-${Date.now()}`
    const pendingMessage = {
      id: pendingId,
      match_id: matchId,
      sender_id: currentUserId,
      text,
      created_at: new Date().toISOString(),
      pending: true,
    }

    setPendingMessages((prev) => [...prev, pendingMessage])
    setDraft('')
    setIsSending(true)
    setErrorMessage('')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUserId,
        text,
      })
      .select('id, match_id, sender_id, text, created_at')
      .single()

    if (error) {
      setPendingMessages((prev) => prev.filter((item) => item.id !== pendingId))
      setErrorMessage(error.message)
      setIsSending(false)
      return
    }

    setPendingMessages((prev) => prev.filter((item) => item.id !== pendingId))

    if (data) {
      setMessages((prev) => {
        if (prev.some((item) => item.id === data.id)) {
          return prev
        }

        return [...prev, data]
      })
    }

    setIsSending(false)
  }

  const handleComposerKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return
    }

    event.preventDefault()

    if (!draft.trim() || isSending) {
      return
    }

    event.currentTarget.form?.requestSubmit()
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.26),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_50%,_#fff5f7_100%)] px-4 py-10">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl" />

      <section className="relative z-10 flex h-[min(86vh,880px)] w-full max-w-5xl flex-col overflow-hidden rounded-[40px] border border-white/70 bg-white/85 shadow-[0_30px_90px_rgba(244,114,182,0.18)] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-pink-100 bg-white/80 px-5 py-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-pink-200 bg-pink-50 text-pink-500 transition hover:bg-pink-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
                <img src={avatar} alt={`${title} 的头像`} className="h-full w-full object-cover" />
              </div>
              <div>
                <p className="text-sm text-pink-500">即时聊天室</p>
                <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-pink-100 bg-pink-50/80 px-4 py-2 text-sm font-medium text-pink-500 md:inline-flex">
            <Sparkles className="h-4 w-4" />
            Match #{matchId}
          </div>
        </header>

        <div ref={viewportRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-6 md:px-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
                <LoaderCircle className="h-4 w-4 animate-spin text-pink-400" />
                正在读取聊天记录...
              </div>
            </div>
          ) : renderedMessages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="max-w-md rounded-[28px] border border-pink-100 bg-pink-50/70 px-6 py-5 text-center text-sm leading-7 text-slate-500">
                这是你们的第一段对话。可以先发一句轻松的开场白，比如“你好呀，很高兴在这里遇见你。”
              </div>
            </div>
          ) : (
            renderedMessages.map((message) => {
              const isMine = message.sender_id === currentUserId
              return (
                <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                    <div
                      className={`rounded-[26px] px-4 py-3 text-sm leading-7 shadow-sm ${
                        isMine
                          ? 'rounded-br-md bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-pink-200'
                          : 'rounded-bl-md border border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {message.text}
                    </div>
                    <span className="px-2 text-xs text-slate-400">
                      {message.pending ? '发送中...' : formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <footer className="border-t border-pink-100 bg-white/80 px-5 py-4 backdrop-blur md:px-6">
          {errorMessage && (
            <div className="mb-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              rows="2"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={`对 ${title} 说点什么...`}
              className="min-h-[56px] max-h-40 flex-1 resize-none overflow-y-auto rounded-[24px] border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
            />

            <button
              type="submit"
              disabled={isSending || !draft.trim()}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(244,114,182,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              发送
            </button>
          </form>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>{currentUserProfile?.nickname || '当前用户'} 正在聊天中</span>
            <span>{isSending ? '消息发送中...' : 'Enter 发送，Shift+Enter 换行'}</span>
          </div>
        </footer>
      </section>
    </main>
  )
}
