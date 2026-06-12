export const DAILY_UNVERIFIED_LIKE_LIMIT = 5

export function getStartOfTodayIso() {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

export function isProfileVerified(profile) {
  return Boolean(profile?.is_verified)
}

export function getRemainingLikesToday(profile, dailyLikeCount) {
  if (isProfileVerified(profile)) {
    return Number.POSITIVE_INFINITY
  }

  return Math.max(0, DAILY_UNVERIFIED_LIKE_LIMIT - dailyLikeCount)
}
