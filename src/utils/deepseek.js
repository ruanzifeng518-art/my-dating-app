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
    .slice(0, 60)
}

export async function generateDeepseekIcebreaker({ currentUser, peerUser, recentMessages }) {
  if (!deepseekApiKey) {
    throw new Error('当前环境未配置 VITE_DEEPSEEK_API_KEY。')
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
    throw new Error(payload?.error?.message || 'DeepSeek 接口调用失败，请稍后再试。')
  }

  const suggestion = normalizeSuggestion(payload?.choices?.[0]?.message?.content)

  if (!suggestion) {
    throw new Error('DeepSeek 没有返回可用话术，请稍后再试。')
  }

  return suggestion
}
