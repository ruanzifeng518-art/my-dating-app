export default function PrototypeSteps({ steps }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
      <div className="rounded-[36px] border border-slate-200 bg-white px-6 py-8 shadow-sm lg:px-10">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-medium text-pink-500">适合继续扩展</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            你下一步可以怎么继续做
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            现在这个项目已经是完整 React 工程。后续你可以继续加路由、接口请求、登录注册和后台管理。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="rounded-[28px] bg-slate-50 p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                0{index + 1}
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-600">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
