import { Check } from 'lucide-react'

export default function VerifiedBadge({ label = '官方真人认证', compact = false }) {
  if (compact) {
    return (
      <span
        title={label}
        aria-label={label}
        role="img"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 via-cyan-400 to-fuchsia-400 text-white shadow-[0_8px_18px_rgba(59,130,246,0.35)] ring-1 ring-white/70"
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    )
  }

  return (
    <span
      aria-label={label}
      role="img"
      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-fuchsia-400 px-2.5 py-1 text-xs font-semibold text-white shadow-[0_10px_22px_rgba(59,130,246,0.28)] ring-1 ring-white/70"
    >
      <Check className="h-3.5 w-3.5 stroke-[3]" />
      {label}
    </span>
  )
}
