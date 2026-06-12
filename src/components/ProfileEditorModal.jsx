import { useCallback, useState } from 'react'
import { Camera, Check, LoaderCircle, PencilLine, Sparkles, X } from 'lucide-react'
import LivenessVerificationCard from './LivenessVerificationCard'
import { supabase } from '../supabaseClient'

const INTEREST_OPTIONS = [
  '运动',
  '音乐',
  '旅行',
  '电影',
  '咖啡',
  '阅读',
  '摄影',
  '美食',
  '游戏',
  '宠物',
  '露营',
  '健身',
]

function buildDefaultAvatar(seed) {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(seed)}`
}

function validateProfileForm(form) {
  if (!form.nickname.trim()) {
    throw new Error('请先填写昵称，再进行真人认证。')
  }

  if (!form.age || Number(form.age) < 18) {
    throw new Error('年龄需要是 18 岁以上，才能发起真人认证。')
  }

  if (form.interests.length === 0) {
    throw new Error('至少选择一个兴趣标签，再进行真人认证。')
  }
}

export default function ProfileEditorModal({ open, user, profile, onClose, onSaved }) {
  const defaultNickname = profile?.nickname || user?.user_metadata?.nickname || user?.email?.split('@')[0] || '新用户'

  const [form, setForm] = useState({
    nickname: defaultNickname,
    gender: profile?.gender || 'male',
    age: String(profile?.age || 24),
    avatarUrl: profile?.avatar_url || buildDefaultAvatar(defaultNickname),
    bio: profile?.bio || '',
    interests: profile?.interests?.length ? profile.interests : ['音乐', '旅行'],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isVerified, setIsVerified] = useState(Boolean(profile?.is_verified))

  const toggleInterest = (interest) => {
    setForm((prev) => {
      const exists = prev.interests.includes(interest)
      return {
        ...prev,
        interests: exists ? prev.interests.filter((item) => item !== interest) : [...prev.interests, interest],
      }
    })
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const buildProfilePayload = useCallback(() => {
    validateProfileForm(form)

    return {
      id: user.id,
      nickname: form.nickname.trim(),
      gender: form.gender,
      age: Number(form.age),
      avatar_url: form.avatarUrl.trim() || buildDefaultAvatar(form.nickname.trim()),
      bio: form.bio.trim(),
      interests: form.interests,
      is_verified: isVerified,
    }
  }, [form, isVerified, user.id])

  const persistVerifiedProfile = useCallback(
    async (payload) => {
      const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select('*').single()

      if (error) {
        throw error
      }

      setIsVerified(true)
      onSaved?.(data)
      return data
    },
    [onSaved],
  )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    try {
      validateProfileForm(form)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message.replace('，再进行真人认证', '') : '请先完善资料。')
      return
    }

    setIsSubmitting(true)
    const payload = buildProfilePayload()

    const { data, error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' }).select('*').single()

    if (error) {
      setErrorMessage(error.message)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    onSaved?.(data)
    onClose?.()
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 px-4 py-6 backdrop-blur-[2px]">
      <button type="button" aria-label="关闭资料编辑弹层" className="absolute inset-0" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 grid w-full max-w-5xl gap-8 rounded-[36px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_80px_rgba(244,114,182,0.18)] backdrop-blur-xl lg:grid-cols-[0.42fr_0.58fr]"
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-500">
                <PencilLine className="h-4 w-4" />
                编辑个人资料
              </div>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">随时更新你的个人名片</h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                修改后会立即写回 `profiles` 表，新的头像、昵称和简介会同步显示在当前界面。
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-white text-slate-500 transition hover:bg-pink-50 hover:text-pink-500"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mx-auto flex h-56 w-56 items-center justify-center overflow-hidden rounded-[32px] border border-pink-100 bg-pink-50 shadow-lg shadow-pink-100/60">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="头像预览" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-10 w-10 text-pink-300" />
            )}
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">头像 URL</span>
            <input
              type="url"
              name="avatarUrl"
              value={form.avatarUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <button
            type="button"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                avatarUrl: buildDefaultAvatar(prev.nickname || defaultNickname),
              }))
            }
            className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-2 text-sm font-medium text-pink-500 transition hover:bg-pink-100"
          >
            <Camera className="h-4 w-4" />
            使用默认头像
          </button>
        </div>

        <div className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">昵称</span>
            <input
              type="text"
              name="nickname"
              value={form.nickname}
              onChange={handleChange}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">性别</span>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
              >
                <option value="male">男</option>
                <option value="female">女</option>
                <option value="other">其他</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-600">年龄</span>
              <input
                type="number"
                min="18"
                max="99"
                name="age"
                value={form.age}
                onChange={handleChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-600">个人简介</span>
            <textarea
              name="bio"
              rows="4"
              value={form.bio}
              onChange={handleChange}
              placeholder="用两三句话介绍一下你自己..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-700 shadow-sm outline-none placeholder:text-slate-400"
            />
          </label>

          <div>
            <span className="mb-3 block text-sm font-medium text-slate-600">兴趣标签</span>
            <div className="flex flex-wrap gap-3">
              {INTEREST_OPTIONS.map((interest) => {
                const selected = form.interests.includes(interest)
                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-200'
                        : 'border border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {selected && <Check className="h-4 w-4" />}
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          <LivenessVerificationCard
            compact
            isVerified={isVerified}
            getProfilePayload={buildProfilePayload}
            onVerifySuccess={persistVerifiedProfile}
            errorMessage={errorMessage}
          />

          {errorMessage && (
            <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-500">
              {errorMessage}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50"
            >
              取消
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-400 px-6 py-3.5 text-sm font-medium text-white shadow-[0_16px_36px_rgba(244,114,182,0.35)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              保存资料
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
