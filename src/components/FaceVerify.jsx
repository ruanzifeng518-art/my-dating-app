import { ArrowLeft, Camera, ShieldCheck, Sparkles } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import LivenessVerificationCard from './LivenessVerificationCard'
import VerifiedBadge from './VerifiedBadge'
import { supabase } from '../supabaseClient'

function buildProfilePayload(profile) {
  return {
    id: profile.id,
    nickname: profile.nickname,
    gender: profile.gender,
    age: profile.age,
    avatar_url: profile.avatar_url || '',
    bio: profile.bio || '',
    interests: Array.isArray(profile.interests) ? profile.interests : [],
    latitude: profile.latitude ?? null,
    longitude: profile.longitude ?? null,
    location_updated_at: profile.location_updated_at ?? null,
    is_verified: Boolean(profile.is_verified),
  }
}

export default function FaceVerify({ profile, onBack, onVerified }) {
  const isVerified = Boolean(profile?.is_verified)
  const profileId = profile?.id

  const statusText = useMemo(() => {
    if (isVerified) {
      return '已认证'
    }

    return '未认证'
  }, [isVerified])

  const saveVerifiedProfile = useCallback(
    async (payload) => {
      const { data, error } = await supabase.from('profiles').update(payload).eq('id', profileId).select('*').single()

      if (error) {
        throw error
      }

      onVerified?.(data)
      return data
    },
    [onVerified, profileId],
  )

  const getProfilePayload = useCallback(() => buildProfilePayload(profile), [profile])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.24),_transparent_22%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_52%,_#f7fbff_100%)] px-4 pb-20 pt-8">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-sky-200/25 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500"
              >
                <ArrowLeft className="h-4 w-4" />
                返回个人中心
              </button>

              <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600">
                <Sparkles className="h-4 w-4" />
                Face Authentication
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">真人活体认证</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                  对齐圆形人脸框后，系统会动态提示你眨眼或轻轻转头。认证通过后，会自动把 `profiles.is_verified`
                  更新为 `true`，并在缘分卡片流、雷达地图和动态广场里永久点亮官方真人认证蓝勾徽章。
                </p>
              </div>
            </div>

            <div className="rounded-[30px] border border-pink-100 bg-pink-50/70 p-5 shadow-sm">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium text-slate-600 shadow-sm">
                <ShieldCheck className="h-4 w-4 text-pink-500" />
                当前状态：{statusText}
              </div>
              <div className="mt-4 flex items-center gap-3">
                {isVerified ? <VerifiedBadge /> : <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500">未认证</span>}
                <span className="text-sm leading-7 text-slate-500">
                  {isVerified ? '已完成认证，仍可再次发起识别进行复核。' : '完成后会自动解除未认证用户的每日点赞限制。'}
                </span>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-pink-100 bg-white px-3 py-1.5 text-xs font-medium text-pink-500">
                <Camera className="h-3.5 w-3.5" />
                请正对摄像头 · 请眨眨眼
              </div>
            </div>
          </div>
        </div>

        <LivenessVerificationCard isVerified={isVerified} getProfilePayload={getProfilePayload} onVerifySuccess={saveVerifiedProfile} />
      </section>
    </main>
  )
}
