const SYSTEM_PROMPT =
  '你是一个情商极高的恋爱红娘，请根据当前男女双方的聊天语境和标签，生成一句幽默、能打破冷场或推进关系的 30 字以内破冰回复。'

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions'
const deepseekApiKey = import.meta.env.VITE_DEEPSEEK_API_KEY

function safeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : []
}

function normalizeSuggestion(text) {
  return String(text || '')
    .replace(/^["'“”‘’\s]+|["'“”‘’\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30)
}

function buildFallbackSuggestion({ currentUser, peerUser, recentMessages }) {
  const currentInterests = safeArray(currentUser?.interests)
  const peerInterests = safeArray(peerUser?.interests)
  const overlap = currentInterests.filter((tag) => peerInterests.includes(tag))
  const latestText = safeArray(recentMessages).slice(-1)[0]?.text || ''

  const candidates = [
    overlap[0] ? `原来你也喜欢${overlap[0]}，下次一起安排？` : '',
    latestText.includes('咖啡') ? '咖啡我请，你负责分享最近的开心事？' : '',
    latestText.includes('电影') ? '那下次看电影，你负责选片我负责带零食？' : '',
    latestText.includes('音乐') ? '要不你先分享首单曲，我负责认真循环？' : '',
    peerInterests[0] ? `你最推荐的${peerInterests[0]}体验是哪一次？` : '',
    '感觉我们聊天挺顺的，要不要继续深挖彼此的小爱好？',
    '你这句话很加分，我都想顺着话题多认识你一点了。',
    '要不我们交换一个最近最上头的小兴趣？',
  ]

  return normalizeSuggestion(candidates.find(Boolean) || '感觉你挺有趣的，要不要继续多聊两句？')
}

export async function generateDeepseekIcebreaker({ currentUser, peerUser, recentMessages }) {
  if (!deepseekApiKey) {
    return buildFallbackSuggestion({ currentUser, peerUser, recentMessages })
  }

  const currentInterests = safeArray(currentUser?.interests)
  const peerInterests = safeArray(peerUser?.interests)
  const messages = safeArray(recentMessages).slice(-5)

  const messageSummary =
    messages.length > 0
      ? messages
          .map((item, index) => `${index + 1}. ${item.speaker || item.role || '用户'}：${item.text || ''}`)
          .join('\n')
      : '最近还没有聊天记录，请结合双方兴趣标签主动开启轻松自然的话题。'

  const userPrompt = [
    `我方昵称：${currentUser?.nickname || '当前用户'}`,
    `我方兴趣标签：${currentInterests.join('、') || '暂无'}`,
    `对方昵称：${peerUser?.nickname || '聊天对象'}`,
    `对方兴趣标签：${peerInterests.join('、') || '暂无'}`,
    '',
    '最近 5 条聊天记录：',
    messageSummary,
  ].join('\n')

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      temperature: 1,
      max_tokens: 80,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    return buildFallbackSuggestion({ currentUser, peerUser, recentMessages })
  }

  const suggestion = normalizeSuggestion(payload?.choices?.[0]?.message?.content)

  if (!suggestion) {
    return buildFallbackSuggestion({ currentUser, peerUser, recentMessages })
  }

  return suggestion
}
