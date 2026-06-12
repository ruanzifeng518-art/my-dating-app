import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { LoaderCircle, Sparkles } from 'lucide-react'
import BottomTabBar from './components/BottomTabBar'
import ChatRoom from './components/ChatRoom'
import Login from './components/Login'
import MatchCardPage from './components/MatchCardPage'
import MessagesPage from './components/MessagesPage'
import MyProfileCenter from './components/MyProfileCenter'
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
  const [activeTab, setActiveTab] = useState('cards')
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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
    setActiveTab('cards')
  }

  const handleProfileSaved = (profile) => {
    setCurrentUserProfile(profile)
    setProfileLoadError('')
  }

  const handleOpenChat = ({ profile, match }) => {
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
    setIsProfileEditorOpen(false)
    setActiveChat(null)
    setActiveTab('cards')
    setUnreadCount(0)
    persistCurrentUserId(null)
  }

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

  const renderActiveTab = () => {
    if (activeTab === 'radar') {
      return (
        <Suspense fallback={<LoadingState text="正在加载同城雷达地图资源，请稍等..." />}>
          <MapRadar currentUserId={authUser.id} currentUserProfile={currentUserProfile} onProfileUpdated={handleProfileSaved} />
        </Suspense>
      )
    }

    if (activeTab === 'messages') {
      return (
        <MessagesPage
          currentUserId={authUser.id}
          onOpenChat={handleOpenChat}
          onUnreadCountChange={setUnreadCount}
        />
      )
    }

    if (activeTab === 'me') {
      return (
        <MyProfileCenter
          user={authUser}
          profile={currentUserProfile}
          onEditProfile={() => setIsProfileEditorOpen(true)}
          onSignOut={handleSignOut}
        />
      )
    }

    return <MatchCardPage currentUserId={authUser.id} currentUserProfile={currentUserProfile} onOpenChat={handleOpenChat} />
  }

  return (
    <>
      {profileLoadError && !activeChat && (
        <div className="pointer-events-none fixed left-0 right-0 top-4 z-40 flex justify-center px-4">
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
          <div className="transition-opacity duration-200">{renderActiveTab()}</div>
          <BottomTabBar activeTab={activeTab} onChange={setActiveTab} unreadCount={unreadCount} />
        </>
      )}

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
