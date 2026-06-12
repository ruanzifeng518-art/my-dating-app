import { useCallback, useEffect, useMemo, useState } from 'react'
import { Image as ImageIcon, LoaderCircle, PenSquare, SendHorizonal, Sparkles } from 'lucide-react'
import { supabase } from '../supabaseClient'
import VerifiedBadge from './VerifiedBadge'

function formatPostTime(value) {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60 * 1000) {
    return '刚刚'
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))} 分钟前`
  }

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function buildAvatar(profile) {
  return (
    profile?.avatar_url?.trim() ||
    `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile?.nickname || profile?.id || 'community')}`
  )
}

export default function Community({ currentUserId, currentUserProfile }) {
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const loadPosts = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    const { data: postRows, error: postsError } = await supabase
      .from('posts')
      .select('id, user_id, content, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(60)

    if (postsError) {
      setPosts([])
      setErrorMessage(postsError.message)
      setIsLoading(false)
      return
    }

    const userIds = [...new Set((postRows ?? []).map((post) => post.user_id).filter(Boolean))]

    const { data: profileRows, error: profilesError } = userIds.length
      ? await supabase
          .from('profiles')
          .select('id, nickname, avatar_url, is_verified')
          .in('id', userIds)
      : { data: [], error: null }

    if (profilesError) {
      setPosts([])
      setErrorMessage(profilesError.message)
      setIsLoading(false)
      return
    }

    const profileMap = new Map((profileRows ?? []).map((profile) => [profile.id, profile]))

    const nextPosts = (postRows ?? []).map((post) => {
      const author = profileMap.get(post.user_id) ?? (post.user_id === currentUserId ? currentUserProfile : null)

      return {
        ...post,
        author: {
          id: author?.id || post.user_id,
          nickname: author?.nickname || '神秘用户',
          avatar_url: buildAvatar(author),
          is_verified: Boolean(author?.is_verified),
        },
      }
    })

    setPosts(nextPosts)
    setIsLoading(false)
  }, [currentUserId, currentUserProfile])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPosts()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [loadPosts])

  const handlePublish = async () => {
    const trimmedContent = content.trim()
    const trimmedImageUrl = imageUrl.trim()

    if (!trimmedContent && !trimmedImageUrl) {
      setErrorMessage('至少输入动态文字或图片链接后再发布。')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    const { error } = await supabase.from('posts').insert({
      user_id: currentUserId,
      content: trimmedContent,
      image_url: trimmedImageUrl || null,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    setContent('')
    setImageUrl('')
    setSuccessMessage('动态发布成功，广场已经刷新。')
    setIsSubmitting(false)
    await loadPosts()
  }

  const feedSummary = useMemo(() => `${posts.length} 条动态`, [posts.length])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.2),_transparent_22%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_52%,_#f8fbff_100%)] px-4 pb-32 pt-8">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-sky-200/25 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-500">
                <Sparkles className="h-4 w-4" />
                遇见动态圈
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">动态广场</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-base">
                在这里分享日常、兴趣和心情。全平台用户的动态会按时间倒序出现，认证用户的昵称后会自动点亮粉蓝官方真人认证蓝勾徽章。
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <PenSquare className="h-4 w-4 text-pink-400" />
              {feedSummary}
            </div>
          </div>
        </div>

        <section className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl md:p-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
              <img src={buildAvatar(currentUserProfile)} alt={`${currentUserProfile?.nickname || '当前用户'} 的头像`} className="h-full w-full object-cover" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">发布一条动态</h2>
              <p className="text-sm text-slate-500">输入文字、粘贴图片链接，就能把你的近况发到广场。</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={4}
              placeholder="今天想分享什么？比如最近想去的城市、刚追完的电影，或者一句让人心动的话。"
              className="w-full rounded-[28px] border border-pink-100 bg-pink-50/50 px-4 py-4 text-sm leading-7 text-slate-700 outline-none transition focus:border-pink-200 focus:bg-white focus:ring-4 focus:ring-pink-100/70"
            />

            <div className="relative">
              <ImageIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-pink-400" />
              <input
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="可选：粘贴图片链接，例如 https://..."
                className="w-full rounded-full border border-pink-100 bg-white px-11 py-3 text-sm text-slate-700 outline-none transition focus:border-pink-200 focus:ring-4 focus:ring-pink-100/70"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-500">支持纯文字动态，也支持文字 + 图片链接组合发布。</div>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-5 py-3 text-sm font-medium text-white shadow-[0_16px_32px_rgba(244,114,182,0.28)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                发布
              </button>
            </div>

            {errorMessage && <div className="rounded-[24px] border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-500">{errorMessage}</div>}
            {successMessage && <div className="rounded-[24px] border border-pink-100 bg-pink-50 px-4 py-3 text-sm text-pink-500">{successMessage}</div>}
          </div>
        </section>

        <section className="space-y-4">
          {isLoading ? (
            <div className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-12 text-center shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-4 py-2 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin text-pink-400" />
                正在加载广场动态...
              </div>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-[32px] border border-white/70 bg-white/90 px-6 py-12 text-center shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl">
              <p className="text-sm leading-7 text-slate-500">广场还没有动态，发出第一条内容，做第一个点亮氛围的人吧。</p>
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                className="rounded-[32px] border border-white/70 bg-white/92 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.10)] backdrop-blur-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-pink-100 bg-pink-50">
                    <img src={post.author.avatar_url} alt={`${post.author.nickname} 的头像`} className="h-full w-full object-cover" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-900">{post.author.nickname}</h2>
                      {post.author.is_verified && <VerifiedBadge compact />}
                      <span className="text-xs text-slate-400">{formatPostTime(post.created_at)}</span>
                    </div>

                    {post.content ? <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-700">{post.content}</p> : null}

                    {post.image_url ? (
                      <div className="mt-4 overflow-hidden rounded-[24px] border border-pink-100 bg-pink-50/60">
                        <img src={post.image_url} alt="动态配图" className="max-h-[420px] w-full object-cover" />
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))
          )}
        </section>
      </section>
    </main>
  )
}
