export default function Header() {
  const navItems = ['首页', '推荐', '匹配', '消息', '会员']

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <div>
          <p className="text-lg font-semibold tracking-tight text-slate-900">心动配对</p>
          <p className="text-sm text-slate-500">Dating App Frontend Prototype</p>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href="/"
              className="transition hover:text-pink-500"
              onClick={(event) => event.preventDefault()}
            >
              {item}
            </a>
          ))}
        </nav>

        <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700">
          开始体验
        </button>
      </div>
    </header>
  )
}
