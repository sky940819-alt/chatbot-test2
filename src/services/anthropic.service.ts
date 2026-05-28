import type { Message } from '@/store'

type ChatMsg = Pick<Message, 'role' | 'content'>

const BASE = 'https://api.anthropic.com/v1'
const VERSION = '2023-06-01'

const headers = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'x-api-key': apiKey,
  'anthropic-version': VERSION,
})

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}/models`, { headers: headers(apiKey) })
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
  systemPrompt: string
): Promise<string> {
  const res = await fetch(`${BASE}/messages`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API 오류: ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text
}

export async function* streamMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/messages`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    }),
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
        if (!line.startsWith('data: ')) continue
        try {
          const json = JSON.parse(line.slice(6))
          // content_block_delta carries text_delta
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            yield json.delta.text
          }
        } catch { /* ignore */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
