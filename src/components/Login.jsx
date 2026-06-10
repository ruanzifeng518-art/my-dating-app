import { useMemo, useState } from 'react'
import { Heart, LoaderCircle, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { supabase } from '../supabaseClient'

function defaultNicknameFromEmail(email) {
  return email.split('@')[0]?.slice(0, 16) || '新用户'
}

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const title = useMemo(
    () => (mode === 'login' ? '欢迎回来，继续心动之旅' : '创建账号，开启第一次匹配'),
    [mode],
  )

  const description = useMemo(
    () =>
      mode === 'login'
        ? '使用邮箱和密码登录。登录成功后，系统会自动识别你是否已经完善过资料。'
        : '注册成功后，如果是第一次登录，系统会引导你先完善资料，再进入缘分匹配卡片页。',
    [mode],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const resetMessages = () => {
    setErrorMessage('')
    setSuccessMessage('')
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    resetMessages()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    resetMessages()

    if (!form.email || !form.password) {
      setErrorMessage('请先填写完整的邮箱和密码。')
      return
    }

    if (mode === 'register' && form.password !== form.confirmPassword) {
      setErrorMessage('两次输入的密码不一致，请重新检查。')
      return
    }

    setIsSubmitting(true)

    if (mode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nickname: defaultNicknameFromEmail(form.email),
          },
        },
      })

      if (error) {
        setErrorMessage(error.message)
        setIsSubmitting(false)
        return
      }

      if (!data.session) {
        setSuccessMessage('注册成功。请先去邮箱完成验证，再回来登录。')
        setMode('login')
        setIsSubmitting(false)
        return
      }

      setSuccessMessage('注册成功，正在进入资料完善流程...')
      setIsSubmitting(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    setSuccessMessage('登录成功，正在进入应用...')
    setIsSubmitting(false)
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.26),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(244,114,182,0.22),_transparent_28%),linear-gradient(180deg,_#fff8fb_0%,_#fff_50%,_#fff5f7_100%)] px-4 py-10">
      <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
      <div className="absolute bottom-10 right-0 h-80 w-80 rounded-full bg-rose-300/20 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-6xl gap-8 lg:grid-cols-[0.96fr_1.04fr]">
        <div className="rounded-[36px] border border-white/70 bg-white/75 p-8 shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur-xl md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-500">
            <Sparkles className="h-4 w-4" />
            登录与注册
          </div>

          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-8 text-slate-500 md:text-lg">{description}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[28px] bg-pink-50 p-5">
              <p className="text-2xl font-semibold text-slate-900">1</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">注册或登录后，自动识别是否首次进入。</p>
            </div>
            <div className="rounded-[28px] bg-rose-50 p-5">
              <p className="text-2xl font-semibold text-slate-900">2</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">第一次登录会进入资料完善引导。</p>
            </div>
            <div className="rounded-[28px] bg-orange-50 p-5">
              <p className="text-2xl font-semibold text-slate-900">3</p>
              <p className="mt-2 text-sm leading-7 text-slate-500">资料完成后直接进入推荐卡片页。</p>
            </div>
          </div>
        </div>

        <div className="rounded-[36px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(244,114,182,0.16)] backdrop-blur-xl md:p-10">
          <div className="mb-8 inline-flex rounded-full border border-pink-100 bg-pink-50/80 p-1">
            <button
              type="button"
              onClick={() => handleModeChange('login')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === 'login' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-500'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('register')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                mode === 'register' ? 'bg-white text-pink-500 shadow-sm' : 'text-slate-500'
              }`}
            >
              注册
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">邮箱</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Mail className="h-4 w-4 text-pink-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">密码</span>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <LockKeyhole className="h-4 w-4 text-pink-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="至少 6 位"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </label>

            {mode === 'register' && (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-600">确认密码</span>
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <LockKeyhole className="h-4 w-4 text-pink-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="再次输入密码"
                    className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  />
                </div>
              </label>
            )}

            {errorMessage && (
              <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-500">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3.5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(244,114,182,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4 fill-current" />}
              {mode === 'login' ? '登录进入' : '注册账号'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}
