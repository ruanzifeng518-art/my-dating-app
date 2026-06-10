function buildReadStorageKey(userId, matchId) {
  return `chat:last-read:${userId}:${matchId}`
}

export function getLastReadAt(userId, matchId) {
  if (!userId || !matchId || typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(buildReadStorageKey(userId, matchId))
}

export function setLastReadAt(userId, matchId, timestamp) {
  if (!userId || !matchId || !timestamp || typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(buildReadStorageKey(userId, matchId), timestamp)
}
