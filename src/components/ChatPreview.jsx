export default function ChatPreview({ chatMoments }) {
  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-2xl shadow-slate-300/40">
        <p className="text-sm font-medium text-pink-200">消息流原型</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          让“第一句话”变得没那么难
        </h2>
        <p className="mt-4 text-sm leading-7 text-white/70">
          你可以把这里继续拆成完整聊天页，接入 WebSocket、已读状态、表情选择器与语音入口。
        </p>

        <div className="mt-8 space-y-4">
          <div className="ml-auto max-w-xs rounded-3xl rounded-br-md bg-pink-500 px-5 py-4 text-sm leading-7">
            你好呀，我看到你也很喜欢看展。最近有推荐的展览吗？
          </div>
          <div className="max-w-xs rounded-3xl rounded-bl-md bg-white/10 px-5 py-4 text-sm leading-7 text-white/85">
            有的，我上周刚看完一个摄影展。如果你也喜欢拍照，我们应该会很有话题。
          </div>
          <div className="ml-auto max-w-sm rounded-3xl rounded-br-md bg-white px-5 py-4 text-sm leading-7 text-slate-700">
            那太巧了，我也喜欢边散步边拍照。周末有没有你常去的地方？
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {chatMoments.map((item) => (
          <article key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-pink-500">{item.title}</p>
            <p className="mt-3 text-base leading-8 text-slate-600">{item.content}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
