import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Compass, Heart, LoaderCircle, LogOut, MessageCircle, PencilLine, Sparkles } from 'lucide-react'
import ChatRoom from './components/ChatRoom'
import Login from './components/Login'
import MatchCardPage from './components/MatchCardPage'
import MatchesDrawer from './components/MatchesDrawer'
import OnboardingFlow from './components/OnboardingFlow'
import ProfileEditorModal from './components/ProfileEditorModal'
import { isSupabaseConfigured, supabase } from './supabaseClient'

const MapRadar = lazy(() => import('./components/MapRadar'))

function ConfigState() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.26),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_50%,_#fff5f7_100%)] px-4 py-10">
      <div className="w-full max-w-3xl rounded-[36px] border border-white/70 bg-white/85 p-10 text-center shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-pink-50 text-pink-500">
          <Sparkles className="h-8 w-8" />
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900">Supabase 配置还没完成</h1>
        <p className="mt-4 text-base leading-8 text-slate-500">
          请先检查项目根目录的 `.env`，确认 `VITE_SUPABASE_URL` 和
          `VITE_SUPABASE_ANON_KEY` 都已经填写，然后重启 `npm run dev`。
        </p>
      </div>
    </main>
  )
}

function LoadingState({ text }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.26),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_50%,_#fff5f7_100%)] px-4 py-10">
      <div className="w-full max-w-xl rounded-[36px] border border-white/70 bg-white/85 p-10 text-center shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-pink-50 text-pink-500">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
        <p className="mt-6 text-base leading-8 text-slate-500">{text}</p>
      </div>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [currentUserProfile, setCurrentUserProfile] = useState(null)
  const [isInitializing, setIsInitializing] = useState(isSupabaseConfigured)
  const [isLoadingProfile, setIsLoadingProfile] = useState(false)
  const [profileLoadError, setProfileLoadError] = useState('')
  const [activeChat, setActiveChat] = useState(null)
  const [activeView, setActiveView] = useState('cards')
  const [isMatchesOpen, setIsMatchesOpen] = useState(false)
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)

  const persistCurrentUserId = useCallback((userId) => {
    if (userId) {
      window.localStorage.setItem('current_user_id', userId)
      window.current_user_id = userId
      return
    }

    window.localStorage.removeItem('current_user_id')
    window.current_user_id = null
  }, [])

  const loadCurrentUserProfile = useCallback(async (userId) => {
    if (!supabase || !userId) {
      setCurrentUserProfile(null)
      setIsLoadingProfile(false)
      return
    }

    setIsLoadingProfile(true)
    setProfileLoadError('')

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setCurrentUserProfile(null)
      setProfileLoadError(error.message)
      setIsLoadingProfile(false)
      return
    }

    setCurrentUserProfile(data ?? null)
    setIsLoadingProfile(false)
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let active = true

    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!active) {
        return
      }

      if (error) {
        setProfileLoadError(error.message)
      }

      const nextSession = data.session ?? null
      setSession(nextSession)
      setAuthUser(nextSession?.user ?? null)
      persistCurrentUserId(nextSession?.user?.id ?? null)
      if (nextSession?.user?.id) {
        loadCurrentUserProfile(nextSession.user.id)
      }
      setIsInitializing(false)
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthUser(nextSession?.user ?? null)
      persistCurrentUserId(nextSession?.user?.id ?? null)
      if (nextSession?.user?.id) {
        loadCurrentUserProfile(nextSession.user.id)
      } else {
        setCurrentUserProfile(null)
        setIsLoadingProfile(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadCurrentUserProfile, persistCurrentUserId])

  const handleProfileCompleted = (profile) => {
    setCurrentUserProfile(profile)
    setProfileLoadError('')
    setActiveView('cards')
  }

  const handleProfileSaved = (profile) => {
    setCurrentUserProfile(profile)
    setProfileLoadError('')
  }

  const handleOpenChat = ({ profile, match }) => {
    setIsMatchesOpen(false)
    setActiveView('cards')
    setActiveChat({
      profile,
      match,
    })
  }

  const handleCloseChat = () => {
    setActiveChat(null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setAuthUser(null)
    setCurrentUserProfile(null)
    setIsMatchesOpen(false)
    setIsProfileEditorOpen(false)
    setActiveChat(null)
    setActiveView('cards')
    persistCurrentUserId(null)
  }

  const userSummary = useMemo(() => {
    if (!authUser) {
      return null
    }

    return {
      email: authUser.email,
      age: currentUserProfile?.age,
      genderLabel:
        currentUserProfile?.gender === 'male' ? '男' : currentUserProfile?.gender === 'female' ? '女' : '其他',
      interestCount: currentUserProfile?.interests?.length ?? 0,
    }
  }, [authUser, currentUserProfile])

  if (!isSupabaseConfigured) {
    return <ConfigState />
  }

  if (isInitializing) {
    return <LoadingState text="正在检查登录状态与本地会话，请稍等..." />
  }

  if (!session || !authUser) {
    return <Login />
  }

  if (isLoadingProfile) {
    return <LoadingState text="登录成功，正在读取你的资料..." />
  }

  if (!currentUserProfile) {
    return <OnboardingFlow user={authUser} onComplete={handleProfileCompleted} />
  }

  return (
    <>
      {!activeChat && (
        <div className="pointer-events-none fixed left-0 right-0 top-4 z-40 flex justify-center px-4">
          <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-[32px] border border-white/70 bg-white/82 px-5 py-3 shadow-lg shadow-pink-100/60 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-pink-100 bg-pink-50 shadow-sm">
                {currentUserProfile.avatar_url ? (
                  <img src={currentUserProfile.avatar_url} alt="当前用户头像" className="h-full w-full object-cover" />
                ) : (
                  <Heart className="h-5 w-5 text-pink-400" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800">{currentUserProfile.nickname}</p>
                  <span className="rounded-full border border-pink-100 bg-pink-50 px-2.5 py-1 text-[11px] font-medium text-pink-500">
                    资料已完善
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>{userSummary?.email}</span>
                  <span>·</span>
                  <span>
                    {userSummary?.genderLabel} · {userSummary?.age} 岁
                  </span>
                  <span>·</span>
                  <span>{userSummary?.interestCount} 个兴趣标签</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMatchesOpen(false)
                  setActiveView((current) => (current === 'radar' ? 'cards' : 'radar'))
                }}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  activeView === 'radar'
                    ? 'border-cyan-200 bg-cyan-50 text-cyan-600'
                    : 'border-pink-200 bg-white text-slate-600 hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500'
                }`}
              >
                <Compass className="h-4 w-4" />
                同城雷达
              </button>

              <button
                type="button"
                onClick={() => setIsProfileEditorOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500"
              >
                <PencilLine className="h-4 w-4" />
                编辑资料
              </button>

              <button
                type="button"
                onClick={() => setIsMatchesOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500"
              >
                <MessageCircle className="h-4 w-4" />
                会话列表
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2.5 text-sm font-medium text-pink-500 transition hover:bg-pink-100"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>
      )}

      {profileLoadError && !activeChat && (
        <div className="pointer-events-none fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4">
          <div className="pointer-events-auto rounded-full border border-rose-100 bg-white px-4 py-2 text-sm text-rose-500 shadow-lg shadow-rose-100/60">
            资料读取提示：{profileLoadError}
          </div>
        </div>
      )}

      {activeChat ? (
        <ChatRoom
          match={activeChat.match}
          currentUserId={authUser.id}
          currentUserProfile={currentUserProfile}
          peerProfile={activeChat.profile}
          onBack={handleCloseChat}
        />
      ) : (
        <>
          {activeView === 'radar' ? (
            <Suspense fallback={<LoadingState text="正在加载同城雷达地图资源，请稍等..." />}>
              <MapRadar
                currentUserId={authUser.id}
                currentUserProfile={currentUserProfile}
                onProfileUpdated={handleProfileSaved}
              />
            </Suspense>
          ) : (
            <MatchCardPage
              currentUserId={authUser.id}
              currentUserProfile={currentUserProfile}
              onOpenChat={handleOpenChat}
            />
          )}
        </>
      )}

      <MatchesDrawer
        open={!activeChat && isMatchesOpen}
        currentUserId={authUser.id}
        onClose={() => setIsMatchesOpen(false)}
        onOpenChat={handleOpenChat}
      />

      {!activeChat && isProfileEditorOpen && (
        <ProfileEditorModal
          key={`${currentUserProfile.id}-${currentUserProfile.nickname}-${currentUserProfile.age}-${currentUserProfile.avatar_url || ''}`}
          open
          user={authUser}
          profile={currentUserProfile}
          onClose={() => setIsProfileEditorOpen(false)}
          onSaved={handleProfileSaved}
        />
      )}
    </>
  )
}

export default App
