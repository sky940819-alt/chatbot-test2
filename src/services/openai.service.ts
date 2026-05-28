import type { Message } from '@/store'

type ChatMsg = Pick<Message, 'role' | 'content'>

const OPENAI_BASE = 'https://api.openai.com/v1'
const UPSTAGE_BASE = 'https://api.upstage.ai/v1'

function baseUrl(provider: string) {
  return provider === 'upstage' ? UPSTAGE_BASE : OPENAI_BASE
}

// o-series models don't support temperature and use max_completion_tokens
function isReasoningModel(model: string) {
  return /^o\d/.test(model)
}

export async function validateApiKey(
  apiKey: string,
  provider = 'openai'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${baseUrl(provider)}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })
    if (res.ok) return { valid: true }
    const data = await res.json().catch(() => ({}))
    return { valid: false, error: data?.error?.message || `HTTP ${res.status}` }
  } catch {
    return { valid: false, error: '네트워크 오류가 발생했습니다.' }
  }
}

export async function sendMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string,
  provider = 'openai'
): Promise<string> {
  const reasoning = isReasoningModel(model)
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: false,
    ...(reasoning
      ? { max_completion_tokens: maxTokens }
      : { temperature, max_tokens: maxTokens }),
  }

  const res = await fetch(`${baseUrl(provider)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API 오류: ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

export async function* streamMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string,
  provider = 'openai'
): AsyncGenerator<string> {
  const reasoning = isReasoningModel(model)
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    stream: true,
    ...(reasoning
      ? { max_completion_tokens: maxTokens }
      : { temperature, max_tokens: maxTokens }),
  }

  const res = await fetch(`${baseUrl(provider)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API 오류: ${res.status}`)
  }

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new Error('스트림을 읽을 수 없습니다.')

  let buffer = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') return
        try {
          const json = JSON.parse(data)
          const content = json.choices?.[0]?.delta?.content
          if (content) yield content
        } catch { /* ignore */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
