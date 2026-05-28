import type { Message } from '@/store'

type ChatMsg = Pick<Message, 'role' | 'content'>

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

function toGeminiRole(role: string) {
  return role === 'user' ? 'user' : 'model'
}

export async function validateApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE}?key=${apiKey}`)
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
  const url = `${BASE}/${model}:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({
        role: toGeminiRole(m.role),
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API 오류: ${res.status}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

export async function* streamMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string
): AsyncGenerator<string> {
  const url = `${BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: messages.map((m) => ({
        role: toGeminiRole(m.role),
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature, maxOutputTokens: maxTokens },
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
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch { /* ignore */ }
      }
    }
  } finally {
    reader.releaseLock()
  }
}
