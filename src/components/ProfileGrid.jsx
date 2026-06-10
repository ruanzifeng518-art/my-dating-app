export default function ProfileGrid({ profiles }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-500">推荐卡片示例</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            首页可以直接展示高匹配用户
          </h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-slate-500">
          这里使用了模拟数据。之后你可以把这部分接到真实接口，或者继续扩展为筛选、点赞、聊天等页面。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {profiles.map((profile) => (
          <article
            key={profile.name}
            className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
          >
            <div className={`h-44 bg-gradient-to-br ${profile.gradient}`} />

            <div className="space-y-5 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {profile.name}
                    <span className="ml-2 text-lg font-medium text-slate-400">{profile.age}</span>
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{profile.city}</p>
                </div>
                <div className="rounded-full bg-pink-50 px-3 py-1 text-sm font-medium text-pink-500">
                  {profile.match}% 匹配
                </div>
              </div>

              <p className="text-sm leading-7 text-slate-600">{profile.bio}</p>

              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="text-sm text-slate-500">{profile.status}</span>
                <button className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-pink-500">
                  查看详情
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
