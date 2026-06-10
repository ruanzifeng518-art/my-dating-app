export default function HighlightSection({ highlights }) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-[28px] border border-slate-200 bg-white/85 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-medium text-pink-500">{item.title}</p>
            <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
