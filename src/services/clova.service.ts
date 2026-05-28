import type { Message } from '@/store'

type ChatMsg = Pick<Message, 'role' | 'content'>

const BASE = 'https://clovastudio.stream.naver.com/v3/chat-completions'

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  // CLOVA X는 별도 검증 엔드포인트가 없으므로 형식만 확인
  if (!apiKey || apiKey.length < 20) {
    return { valid: false, error: 'CLOVA X API 키 형식이 올바르지 않습니다.' }
  }
  return { valid: true }
}

export async function sendMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string
): Promise<string> {
  const res = await fetch(`${BASE}/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature,
      maxTokens,
      topP: 0.8,
      topK: 0,
      repeatPenalty: 1.2,
      includeAiFilters: true,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.status?.message || `API 오류: ${res.status}`)
  }
  const data = await res.json()
  return data.result?.message?.content ?? ''
}

export async function* streamMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string
): AsyncGenerator<string> {
  const res = await fetch(`${BASE}/${model}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature,
      maxTokens,
      topP: 0.8,
      topK: 0,
      repeatPenalty: 1.2,
      includeAiFilters: true,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.status?.message || `API 오류: ${res.status}`)
  }

  const reader = res.body?.getReader()
  const decoder = new TextDecoder()
  if (!reader) throw new Error('스트림을 읽을 수 없습니다.')

  // CLOVA X SSE: each event sends the full accumulated text, not a delta
  let prevLen = 0
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
          const full = json.message?.content ?? ''
          if (full.length > prevLen) {
            yield full.slice(prevLen)
            prevLen = full.length
          }
        } catch { /* ignore */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
