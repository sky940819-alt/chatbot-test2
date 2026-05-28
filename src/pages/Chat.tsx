import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Send, Trash2, Bot, User, AlertCircle, StopCircle, Copy, Check } from 'lucide-react'
import { useAppStore } from '@/store'
import { sendMessage, streamMessage } from '@/services/openai.service'
import type { Message } from '@/store'

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={`flex gap-3 animate-slideUp ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-600'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-slate-600 dark:text-slate-200" />
        )}
      </div>

      {/* Bubble */}
      <div className={`group max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
            isUser
              ? 'bg-blue-500 text-white rounded-tr-sm'
              : 'rounded-tl-sm'
          }`}
          style={
            !isUser
              ? { backgroundColor: 'var(--ai-bubble)', color: 'var(--ai-bubble-fg)' }
              : {}
          }
        >
          {msg.content || <span className="typing-cursor opacity-60 text-xs">생성 중</span>}
        </div>

        {/* Footer: time + copy */}
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>
            {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {msg.content && (
            <button
              onClick={copy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded"
              style={{ color: 'var(--muted-fg)' }}
              title="복사"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-slideUp">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-600 shadow-sm">
        <Bot className="h-4 w-4 text-slate-600 dark:text-slate-200" />
      </div>
      <div
        className="px-4 py-3 rounded-2xl rounded-tl-sm"
        style={{ backgroundColor: 'var(--ai-bubble)' }}
      >
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function Chat() {
  const { messages, isLoading, settings, addMessage, updateLastMessage, clearMessages, setLoading } =
    useAppStore()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const adjustTextarea = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  const submit = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return
    if (!settings.apiKey) {
      setError('API 키가 설정되지 않았습니다. 설정 화면에서 API 키를 입력해주세요.')
      return
    }

    setError('')
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    addMessage({ role: 'user', content: text })
    setLoading(true)

    const history = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ]

    try {
      if (settings.streamResponse) {
        setStreaming(true)
        addMessage({ role: 'assistant', content: '' })
        let full = ''
        abortRef.current = new AbortController()

        for await (const chunk of streamMessage(
          history,
          settings.apiKey,
          settings.model,
          settings.temperature,
          settings.maxTokens,
          settings.systemPrompt
        )) {
          full += chunk
          updateLastMessage(full)
        }
        setStreaming(false)
      } else {
        const reply = await sendMessage(
          history,
          settings.apiKey,
          settings.model,
          settings.temperature,
          settings.maxTokens,
          settings.systemPrompt
        )
        addMessage({ role: 'assistant', content: reply })
      }
    } catch (err) {
      setStreaming(false)
      const msg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(msg)
      // remove empty assistant placeholder on stream error
      if (settings.streamResponse) {
        useAppStore.setState((s) => ({
          messages: s.messages.filter((m) => m.content !== ''),
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [input, isLoading, settings, messages, addMessage, updateLastMessage, setLoading])

  const stopStream = () => {
    abortRef.current?.abort()
    setStreaming(false)
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const noKey = !settings.apiKey

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}
      >
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>
            AI 어시스턴트
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-fg)' }}
          >
            {settings.model}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500"
              style={{ color: 'var(--muted-fg)' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              대화 초기화
            </button>
          )}
        </div>
      </div>

      {/* API key warning */}
      {noKey && (
        <div className="mx-4 mt-3 flex items-center gap-2 text-sm px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>
            API 키가 없습니다.{' '}
            <Link to="/settings" className="font-semibold underline underline-offset-2">
              설정
            </Link>
            에서 OpenAI API 키를 입력해주세요.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-4 pb-8 animate-fadeIn">
            <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-3xl">
              <Bot className="h-10 w-10 text-blue-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-base" style={{ color: 'var(--fg)' }}>
                무엇이든 물어보세요
              </p>
              <p className="text-sm" style={{ color: 'var(--muted-fg)' }}>
                Enter로 전송, Shift+Enter로 줄바꿈
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-sm w-full mt-2">
              {['오늘 날씨 어때?', 'Python 코드 작성 도와줘', '영어 번역 부탁해', '좋은 책 추천해줘'].map(
                (q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); textareaRef.current?.focus() }}
                    className="text-left text-sm px-3 py-2.5 rounded-xl border transition-all hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    style={{
                      borderColor: 'var(--card-border)',
                      backgroundColor: 'var(--card)',
                      color: 'var(--fg)',
                    }}
                  >
                    {q}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isLoading && !streaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-2 flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Input area */}
      <div
        className="px-4 py-3 border-t"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}
      >
        <div
          className="flex items-end gap-2 rounded-2xl border px-3 py-2 transition-shadow focus-within:shadow-md focus-within:border-blue-400 dark:focus-within:border-blue-500"
          style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)' }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); adjustTextarea() }}
            onKeyDown={handleKeyDown}
            placeholder={noKey ? 'API 키를 먼저 설정해주세요...' : '메시지를 입력하세요... (Enter: 전송, Shift+Enter: 줄바꿈)'}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent resize-none outline-none text-sm py-1 min-h-[28px] max-h-[160px] disabled:opacity-50"
            style={{ color: 'var(--fg)' }}
          />
          {streaming ? (
            <button
              onClick={stopStream}
              className="flex-shrink-0 p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="중단"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 p-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-600 text-white shadow-sm hover:shadow-md"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-center text-xs mt-1.5" style={{ color: 'var(--muted-fg)' }}>
          AI가 틀린 정보를 제공할 수 있습니다. 중요한 내용은 반드시 확인하세요.
        </p>
      </div>
    </div>
  )
}
