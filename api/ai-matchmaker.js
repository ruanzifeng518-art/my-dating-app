import process from 'node:process'

const SYSTEM_PROMPT =
  '你是一个幽默、情商极高的恋爱牵线红娘。请根据以下男女双方的标签和最近的聊天内容，生成一句绝对能打破冷场、带点幽默感或赞美意味的破冰回复话术。字数在 30 字以内。只输出一句最终话术，不要加解释。'

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: '服务端未配置 DEEPSEEK_API_KEY。' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
    const currentUser = body.currentUser || {}
    const peerUser = body.peerUser || {}
    const recentMessages = safeArray(body.recentMessages).slice(-5)

    const userSummary = [
      `我方昵称：${currentUser.nickname || '当前用户'}`,
      `我方兴趣标签：${safeArray(currentUser.interests).join('、') || '暂无'}`,
      `对方昵称：${peerUser.nickname || '聊天对象'}`,
      `对方兴趣标签：${safeArray(peerUser.interests).join('、') || '暂无'}`,
    ].join('\n')

    const messageSummary =
      recentMessages.length > 0
        ? recentMessages.map((item, index) => `${index + 1}. ${item.speaker || item.role || '用户'}：${item.text || ''}`).join('\n')
        : '最近还没有聊天记录，请结合双方兴趣标签主动开启轻松自然的话题。'

    const upstreamResponse = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
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
            content: `${userSummary}\n\n最近 5 条聊天记录：\n${messageSummary}`,
          },
        ],
      }),
    })

    const payload = await upstreamResponse.json()

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({
        error: payload?.error?.message || 'DeepSeek 接口调用失败。',
      })
    }

    const suggestion = normalizeSuggestion(payload?.choices?.[0]?.message?.content)

    if (!suggestion) {
      return res.status(502).json({ error: 'DeepSeek 没有返回可用话术。' })
    }

    return res.status(200).json({ suggestion })
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'AI 红娘服务异常，请稍后再试。',
    })
  }
}
