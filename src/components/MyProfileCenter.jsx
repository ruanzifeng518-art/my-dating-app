import { Heart, LogOut, Mail, MapPin, PencilLine, ShieldCheck, Sparkles, UserRoundCheck } from 'lucide-react'
import VerifiedBadge from './VerifiedBadge'
import { DAILY_UNVERIFIED_LIKE_LIMIT } from '../utils/verification'

function buildAvatar(profile) {
  return (
    profile?.avatar_url?.trim() ||
    `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(profile?.nickname || 'me')}`
  )
}

export default function MyProfileCenter({ user, profile, onEditProfile, onSignOut }) {
  const avatar = buildAvatar(profile)
  const isVerified = Boolean(profile?.is_verified)

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.22),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.18),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_52%,_#fff5f7_100%)] px-4 pb-32 pt-8">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl" />

      <section className="relative z-10 mx-auto w-full max-w-5xl space-y-6">
        <div className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="h-22 w-22 overflow-hidden rounded-full border border-pink-100 bg-pink-50 shadow-lg shadow-pink-100/70">
                <img src={avatar} alt={`${profile?.nickname || '当前用户'} 的头像`} className="h-full w-full object-cover" />
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-pink-100 bg-pink-50 px-3.5 py-1.5 text-xs font-medium text-pink-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  我的
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{profile?.nickname}</h1>
                  {isVerified ? <VerifiedBadge label="真人认证" /> : null}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="h-4 w-4 text-pink-400" />
                    {user?.email}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <UserRoundCheck className="h-4 w-4 text-pink-400" />
                    {profile?.gender === 'male' ? '男' : profile?.gender === 'female' ? '女' : '其他'} · {profile?.age} 岁
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onEditProfile}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition hover:border-pink-200 hover:bg-pink-50 hover:text-pink-500"
              >
                <PencilLine className="h-4 w-4" />
                编辑资料
              </button>

              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-5 py-3 text-sm font-medium text-pink-500 transition hover:bg-pink-100"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-slate-900">我的名片</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              {profile?.bio?.trim() || '还没有填写个人简介。你可以去编辑资料，让自己的名片更完整。'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {(profile?.interests ?? []).map((tag) => (
                <span key={tag} className="rounded-full border border-pink-100 bg-pink-50 px-3 py-1.5 text-xs font-medium text-pink-500">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-pink-100 bg-pink-50/70 p-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-pink-500 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">真人认证</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  {isVerified
                    ? '你已经完成活体认证，昵称后会永久显示官方蓝底白勾。'
                    : `你还未完成真人认证，未认证用户每天最多喜欢 ${DAILY_UNVERIFIED_LIKE_LIMIT} 次。`}
                </p>
              </div>

              <div className="rounded-[28px] border border-pink-100 bg-pink-50/70 p-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-pink-500 shadow-sm">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900">同城雷达</h3>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  允许浏览器获取定位后，你的地理位置会同步写入资料，用于 5 公里范围内的同城寻缘地图。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(244,114,182,0.12)] backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-slate-900">当前状态</h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-[28px] border border-pink-100 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-pink-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">缘分模式</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">可以继续在卡片流里左右滑动，喜欢的人会进入双向匹配。</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-pink-100 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-pink-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">AI 红娘</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">进入聊天页后，可以让 AI 根据双方兴趣和最近聊天记录自动帮你生成破冰回复。</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-pink-100 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-pink-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">认证状态</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{isVerified ? '已认证，蓝勾已点亮。' : '未认证，建议尽快完成真人认证。'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
