import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, Heart, MapPin, RefreshCcw, Sparkles, X } from 'lucide-react'
import MatchSuccessModal from './MatchSuccessModal'
import { isSupabaseConfigured, supabase } from '../supabaseClient'

const ANIMATION_DURATION = 320
const SWIPE_THRESHOLD = 110
const DISTANCE_PRESETS = ['1.8km', '3.2km', '5.6km', '2.4km', '4.1km', '6.3km', '2.9km']

function StateCard({ title, description, actionLabel, onAction }) {
  return (
    <div className="w-full rounded-[36px] border border-pink-100 bg-white/90 p-10 text-center shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-50 text-pink-500">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="mt-6 text-3xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-base leading-8 text-slate-500">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-pink-200 transition hover:opacity-90"
      >
        <RefreshCcw className="h-4 w-4" />
        {actionLabel}
      </button>
    </div>
  )
}

function mapProfileRows(rows) {
  return rows.map((row, index) => {
    const tags = Array.isArray(row.interests) ? row.interests : []
    const fallbackBio =
      tags.length > 0
        ? `喜欢${tags.slice(0, 2).join('、')}，期待认识能认真交流的人。`
        : '资料还在完善中，希望先从一次真诚的对话开始。'

    return {
      id: row.id,
      name: row.nickname,
      age: row.age,
      distance: DISTANCE_PRESETS[index % DISTANCE_PRESETS.length],
      sign: row.bio?.trim() || fallbackBio,
      tags,
      image:
        row.avatar_url?.trim() ||
        `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(row.nickname)}`,
      likedYou: index === 2,
    }
  })
}

export default function MatchCardPage({ currentUserId, currentUserProfile, onOpenChat }) {
  const [profiles, setProfiles] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [matchedProfile, setMatchedProfile] = useState(null)
  const [matchedRecord, setMatchedRecord] = useState(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')
  const dragStartX = useRef(null)
  const pendingNextIndex = useRef(null)

  const currentProfile = profiles[currentIndex]
  const hasMoreProfiles = Boolean(currentProfile)

  const progressText = useMemo(() => {
    if (!profiles.length) {
      return '0 / 0'
    }

    return `${Math.min(currentIndex + 1, profiles.length)} / ${profiles.length}`
  }, [currentIndex, profiles.length])

  const loadProfiles = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase || !currentUserProfile?.gender || !currentUserId) {
      setLoadError('当前登录用户资料还没准备好，请稍后重试。')
      setProfiles([])
      setIsLoadingProfiles(false)
      return
    }

    setIsLoadingProfiles(true)
    setLoadError('')
    setActionError('')

    const targetGender = currentUserProfile.gender === 'male' ? 'female' : 'male'
    const [profilesResult, likesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, nickname, gender, age, avatar_url, bio, interests, created_at')
        .eq('gender', targetGender)
        .neq('id', currentUserId)
        .order('created_at', { ascending: true }),
      supabase
        .from('likes')
        .select('to_user')
        .eq('from_user', currentUserId),
    ])

    if (profilesResult.error) {
      setProfiles([])
      setLoadError(`读取 Supabase 数据失败：${profilesResult.error.message}`)
      setIsLoadingProfiles(false)
      return
    }

    if (likesResult.error) {
      setProfiles([])
      setLoadError(`读取点赞记录失败：${likesResult.error.message}`)
      setIsLoadingProfiles(false)
      return
    }

    const reactedIds = new Set((likesResult.data ?? []).map((item) => item.to_user))
    const visibleRows = (profilesResult.data ?? []).filter((row) => !reactedIds.has(row.id))
    const mappedProfiles = mapProfileRows(visibleRows)

    setProfiles(mappedProfiles)
    setCurrentIndex(0)
    setMatchedProfile(null)
    setMatchedRecord(null)
    setActionType(null)
    setIsAnimating(false)
    setDragOffset(0)
    pendingNextIndex.current = null
    setIsLoadingProfiles(false)
  }, [currentUserId, currentUserProfile])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      if (!isSupabaseConfigured || !supabase || !currentUserProfile?.gender || !currentUserId) {
        if (cancelled) {
          return
        }

        setLoadError('当前登录用户资料还没准备好，请稍后重试。')
        setProfiles([])
        setIsLoadingProfiles(false)
        return
      }

      setIsLoadingProfiles(true)
      setLoadError('')
      setActionError('')

      const targetGender = currentUserProfile.gender === 'male' ? 'female' : 'male'
      const [profilesResult, likesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, nickname, gender, age, avatar_url, bio, interests, created_at')
          .eq('gender', targetGender)
          .neq('id', currentUserId)
          .order('created_at', { ascending: true }),
        supabase
          .from('likes')
          .select('to_user')
          .eq('from_user', currentUserId),
      ])

      if (cancelled) {
        return
      }

      if (profilesResult.error) {
        setProfiles([])
        setLoadError(`读取 Supabase 数据失败：${profilesResult.error.message}`)
        setIsLoadingProfiles(false)
        return
      }

      if (likesResult.error) {
        setProfiles([])
        setLoadError(`读取点赞记录失败：${likesResult.error.message}`)
        setIsLoadingProfiles(false)
        return
      }

      const reactedIds = new Set((likesResult.data ?? []).map((item) => item.to_user))
      const visibleRows = (profilesResult.data ?? []).filter((row) => !reactedIds.has(row.id))
      const mappedProfiles = mapProfileRows(visibleRows)
      setProfiles(mappedProfiles)
      setCurrentIndex(0)
      setMatchedProfile(null)
      setMatchedRecord(null)
      setActionType(null)
      setIsAnimating(false)
      setDragOffset(0)
      pendingNextIndex.current = null
      setIsLoadingProfiles(false)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [currentUserId, currentUserProfile])

  const moveToNextProfile = useCallback(() => {
    if (pendingNextIndex.current !== null) {
      setCurrentIndex(pendingNextIndex.current)
      pendingNextIndex.current = null
    } else {
      setCurrentIndex((prev) => prev + 1)
    }

    setMatchedProfile(null)
    setMatchedRecord(null)
    setActionType(null)
    setIsAnimating(false)
    setDragOffset(0)
  }, [])

  const openMatchModal = (profile, matchRecord) => {
    pendingNextIndex.current = currentIndex + 1
    setMatchedProfile(profile)
    setMatchedRecord(matchRecord)
    setIsAnimating(false)
    setActionType(null)
    setDragOffset(0)
  }

  const createMatchRecord = async (profileId) => {
    const userA = [currentUserId, profileId].sort()[0]
    const userB = [currentUserId, profileId].sort()[1]

    const { data, error } = await supabase
      .from('matches')
      .upsert(
        {
          user_a: userA,
          user_b: userB,
        },
        { onConflict: 'user_a,user_b' },
      )
      .select('*')
      .single()

    if (error) {
      throw error
    }

    return data
  }

  const persistReaction = async (type, profile) => {
    const status = type === 'like' ? 'like' : 'dislike'
    const { error } = await supabase
      .from('likes')
      .upsert(
        {
          from_user: currentUserId,
          to_user: profile.id,
          status,
        },
        { onConflict: 'from_user,to_user' },
      )

    if (error) {
      throw error
    }

    if (status !== 'like') {
      return false
    }

    const { data, error: reverseError } = await supabase
      .from('likes')
      .select('id, status')
      .eq('from_user', profile.id)
      .eq('to_user', currentUserId)
      .eq('status', 'like')
      .maybeSingle()

    if (reverseError) {
      throw reverseError
    }

    if (!data) {
      return null
    }

    return createMatchRecord(profile.id)
  }

  const handleAction = async (type) => {
    if (!hasMoreProfiles || isAnimating || matchedProfile || !currentProfile) {
      return
    }

    setActionError('')
    setActionType(type)
    setIsAnimating(true)

    try {
      const matchRecord = await persistReaction(type, currentProfile)

      window.setTimeout(() => {
        if (matchRecord) {
          openMatchModal(currentProfile, matchRecord)
          return
        }

        moveToNextProfile()
      }, ANIMATION_DURATION - 20)
    } catch (error) {
      setActionError(`写入数据库失败：${error.message}`)
      setIsAnimating(false)
      setActionType(null)
      setDragOffset(0)
      pendingNextIndex.current = null
      return
    }
  }

  const handleRestart = () => {
    if (profiles.length === 0) {
      loadProfiles()
      return
    }

    setCurrentIndex(0)
    setIsAnimating(false)
    setActionType(null)
    setMatchedProfile(null)
    setMatchedRecord(null)
    setDragOffset(0)
    pendingNextIndex.current = null
  }

  const handleOpenChat = ({ profile, matchRecord }) => {
    setMatchedProfile(null)
    setMatchedRecord(null)
    setActionType(null)
    setIsAnimating(false)
    setDragOffset(0)
    pendingNextIndex.current = null
    moveToNextProfile()
    onOpenChat?.({
      profile,
      match: matchRecord,
    })
  }

  const handlePointerDown = (event) => {
    if (isAnimating || matchedProfile || !hasMoreProfiles) {
      return
    }

    dragStartX.current = event.clientX
  }

  const handlePointerMove = (event) => {
    if (dragStartX.current === null || isAnimating || matchedProfile) {
      return
    }

    const offset = event.clientX - dragStartX.current
    setDragOffset(offset)
  }

  const handlePointerEnd = () => {
    if (dragStartX.current === null || isAnimating || matchedProfile) {
      dragStartX.current = null
      return
    }

    const offset = dragOffset
    dragStartX.current = null

    if (offset > SWIPE_THRESHOLD) {
      void handleAction('like')
      return
    }

    if (offset < -SWIPE_THRESHOLD) {
      void handleAction('dislike')
      return
    }

    setDragOffset(0)
  }

  const cardAnimationClass = isAnimating
    ? actionType === 'like'
      ? 'translate-x-10 -rotate-3 opacity-0'
      : '-translate-x-10 rotate-3 opacity-0'
    : 'translate-x-0 rotate-0 opacity-100'

  const dragRotation = dragOffset / 22
  const cardStyle = isAnimating
    ? undefined
    : {
        transform: `translateX(${dragOffset}px) rotate(${dragRotation}deg)`,
      }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.26),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_50%,_#fff5f7_100%)] px-4 py-10">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl" />

      <section className="relative z-10 w-full max-w-5xl">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white/80 px-4 py-2 text-sm font-medium text-pink-500 shadow-sm backdrop-blur">
            <Sparkles className="h-4 w-4" />
            缘分匹配卡片页
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              左滑无感，右滑心动
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-500 md:text-lg">
              先用 5 位假用户数据演示匹配流程。点击下方按钮后，卡片会淡出并自动切换到下一位。
            </p>
          </div>
        </div>

        <div className="mx-auto flex max-w-md flex-col items-center">
          <div className="mb-5 flex w-full items-center justify-between rounded-full border border-pink-100 bg-white/80 px-5 py-3 text-sm text-slate-500 shadow-sm backdrop-blur">
            <span>今日推荐</span>
            <span className="font-medium text-slate-800">{progressText}</span>
          </div>

          {isLoadingProfiles ? (
            <StateCard
              title="正在读取真实资料"
              description="正在从 Supabase 拉取 profiles 表中的异性用户数据，请稍等片刻。"
              actionLabel="重新加载"
              onAction={loadProfiles}
            />
          ) : loadError ? (
            <StateCard
              title="连接数据库失败"
              description={loadError}
              actionLabel="重试连接"
              onAction={loadProfiles}
            />
          ) : hasMoreProfiles ? (
            <>
              <article
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onPointerLeave={handlePointerEnd}
                className={`relative w-full overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_24px_80px_rgba(244,114,182,0.18)] transition-all duration-300 ${cardAnimationClass}`}
                style={cardStyle}
              >
                <div className="relative h-[520px] overflow-hidden">
                  <img
                    src={currentProfile.image}
                    alt={`${currentProfile.name} 的头像`}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                  <div className="absolute left-5 right-5 top-5 flex items-center justify-between">
                    <div className="rounded-full bg-white/85 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-pink-500 backdrop-blur">
                      MATCH
                    </div>
                    {(actionType || Math.abs(dragOffset) > 24) && (
                      <div
                        className={`rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur ${
                          actionType === 'like' || dragOffset > 24
                            ? 'bg-pink-500/90 text-white'
                            : 'bg-slate-800/85 text-white'
                        }`}
                      >
                        {actionType === 'like' || dragOffset > 24 ? '喜欢' : '无感'}
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-3xl font-semibold">
                          {currentProfile.name}
                          <span className="ml-2 text-2xl font-medium text-white/90">
                            {currentProfile.age}
                          </span>
                        </h2>
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm backdrop-blur">
                          <MapPin className="h-4 w-4" />
                          距离你 {currentProfile.distance}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm leading-7 text-white/90">{currentProfile.sign}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {currentProfile.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-medium tracking-wide text-white backdrop-blur"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                  </div>
                </div>
              </article>

              <div className="mt-8 flex items-center justify-center gap-6">
                <button
                  type="button"
                  disabled={isAnimating}
                  onClick={() => void handleAction('dislike')}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-slate-100 text-slate-500 shadow-lg shadow-slate-200/80 transition hover:-translate-y-1 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="无感"
                >
                  <X className="h-9 w-9" strokeWidth={2.4} />
                </button>

                <button
                  type="button"
                  disabled={isAnimating}
                  onClick={() => void handleAction('like')}
                  className="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-[0_18px_36px_rgba(244,114,182,0.45)] transition hover:-translate-y-1 hover:from-pink-400 hover:to-rose-300 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="喜欢"
                >
                  <Heart className="h-10 w-10 fill-current" strokeWidth={2.2} />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-8 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  无感
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
                  喜欢
                </div>
              </div>

              {actionError && (
                <div className="mt-5 w-full rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm text-rose-500">
                  {actionError}
                </div>
              )}
            </>
          ) : (
            <StateCard
              title={profiles.length ? '今天的缘分卡看完了' : '数据库里还没有可展示的资料'}
              description={
                profiles.length
                  ? '你已经浏览完当前查询到的所有异性资料。点击下方按钮，可以重新从第一张卡片开始预览。'
                  : '请先去 Supabase 运行 `supabase_schema.sql`，或往 `profiles` 表里插入至少几条异性用户资料。'
              }
              actionLabel={profiles.length ? '重新开始' : '重新读取'}
              onAction={profiles.length ? handleRestart : loadProfiles}
            />
          )}
        </div>
      </section>

      <MatchSuccessModal
        profile={matchedProfile}
        currentUserProfile={currentUserProfile}
        matchRecord={matchedRecord}
        onChat={handleOpenChat}
        onClose={moveToNextProfile}
      />
    </main>
  )
}
