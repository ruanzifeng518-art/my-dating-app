import { Heart, MessageCircleHeart, ShieldCheck } from 'lucide-react'

const stats = [
  { label: '今日活跃用户', value: '12,480+' },
  { label: '高匹配推荐', value: '86%' },
  { label: '破冰回复率', value: '74%' },
]

export default function HeroSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-24">
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-600">
          <Heart className="h-4 w-4" />
          面向找对象场景的前端原型
        </div>

        <div className="space-y-5">
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-900 md:text-6xl">
            帮用户更自然地从
            <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">
              认识彼此
            </span>
            走到稳定互动
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">
            这个首页原型包含品牌头图、推荐卡片、聊天提示与关键功能模块，适合你继续往真实产品方向迭代。
          </p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button className="rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-700">
            查看推荐页
          </button>
          <button className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-pink-300 hover:text-pink-500">
            预览消息流
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-sm">
              <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-white/70 bg-slate-900 p-6 text-white shadow-2xl shadow-pink-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.45),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(251,146,60,0.3),_transparent_30%)]" />

        <div className="relative space-y-5">
          <div className="flex items-center justify-between rounded-3xl bg-white/10 px-4 py-3">
            <div>
              <p className="text-sm text-white/70">今日最佳匹配</p>
              <p className="mt-1 text-xl font-semibold">林夏 · 96%</p>
            </div>
            <div className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm text-emerald-200">
              匹配度高
            </div>
          </div>

          <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-300 to-orange-200 text-lg font-semibold text-slate-900">
                夏
              </div>
              <div>
                <p className="text-lg font-semibold">平面设计师 · 上海</p>
                <p className="text-sm text-white/70">爱看展、会烘焙、慢热但真诚</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-white/80">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <MessageCircleHeart className="h-4 w-4 text-pink-200" />
                推荐开场：你最近看过最喜欢的展是什么？
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
                <ShieldCheck className="h-4 w-4 text-emerald-200" />
                已完成真人认证与基础资料审核
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-white text-slate-900 p-5">
              <p className="text-sm text-slate-500">推荐理由</p>
              <p className="mt-2 text-base font-medium leading-7">
                你们都偏好低压力、可持续的相处节奏，兴趣标签重合度较高。
              </p>
            </div>
            <div className="rounded-3xl bg-pink-500/20 p-5">
              <p className="text-sm text-pink-100">下一步动作</p>
              <p className="mt-2 text-base font-medium leading-7 text-white">
                发送破冰问题后，可解锁对方更多生活方式信息。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
