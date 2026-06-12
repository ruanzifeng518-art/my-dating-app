import { Check } from 'lucide-react'

export default function VerifiedBadge({ label = '真人认证', compact = false }) {
  if (compact) {
    return (
      <span
        title={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm shadow-sky-500/25"
      >
        <Check className="h-3.5 w-3.5 stroke-[3]" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm shadow-sky-500/25">
      <Check className="h-3.5 w-3.5 stroke-[3]" />
      {label}
    </span>
  )
}
