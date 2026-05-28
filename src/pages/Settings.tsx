import { useState, useEffect } from 'react'
import {
  Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, Settings as SettingsIcon,
  Sliders, RefreshCw, Brain, ChevronDown, Database, Download, Trash2, BarChart2,
  ExternalLink
} from 'lucide-react'
import { useAppStore } from '@/store'
import { validateApiKey } from '@/services/chat.service'
import { PROVIDERS, getProvider, getModel } from '@/services/providers'

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

function Section({ title, desc, icon: Icon, children }: {
  title: string; desc: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}>
      <div className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--muted)' }}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-blue-500" />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--fg)' }}>{title}</h2>
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>{desc}</p>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function InputField({ type = 'text', className = '', ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input type={type} {...rest}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 ${className}`}
      style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--fg)' }}
    />
  )
}

function SelectField({ className = '', children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...rest}
        className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none appearance-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 pr-9 ${className}`}
        style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--fg)' }}>
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--muted-fg)' }} />
    </div>
  )
}

export function Settings() {
  const { settings, updateSettings, messages, clearMessages, totalTokensUsed, resetTokens } = useAppStore()

  const [tempApiKey, setTempApiKey] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [validation, setValidation] = useState<ValidationState>('idle')
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [local, setLocal] = useState({ ...settings })

  useEffect(() => { setLocal({ ...settings }) }, [settings])

  // reset validation & key input when provider changes
  useEffect(() => {
    setTempApiKey('')
    setValidation('idle')
  }, [local.provider])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const currentProvider = getProvider(local.provider)

  const handleSaveApiKey = async () => {
    const key = tempApiKey.trim()
    if (!key) { showToast('error', 'API 키를 입력해주세요.'); return }

    // Format hints per provider
    if (local.provider === 'openai' && !key.startsWith('sk-')) {
      showToast('error', 'OpenAI API 키는 sk- 로 시작해야 합니다.')
      setValidation('invalid'); return
    }
    if (local.provider === 'anthropic' && !key.startsWith('sk-ant')) {
      showToast('error', 'Anthropic API 키는 sk-ant- 로 시작해야 합니다.')
      setValidation('invalid'); return
    }

    setValidation('validating')
    const result = await validateApiKey(key, local.provider)
    if (result.valid) {
      updateSettings({ apiKey: key, provider: local.provider })
      setValidation('valid')
      showToast('success', 'API 키가 저장되었습니다.')
    } else {
      setValidation('invalid')
      showToast('error', result.error || 'API 키가 유효하지 않습니다.')
    }
  }

  const handleSaveGeneral = () => {
    updateSettings({
      provider: local.provider,
      model: local.model,
      temperature: local.temperature,
      maxTokens: local.maxTokens,
      streamResponse: local.streamResponse,
      systemPrompt: local.systemPrompt,
      theme: local.theme,
      language: local.language,
    })
    showToast('success', '설정이 저장되었습니다.')
  }

  const handleReset = () => {
    if (!confirm('모든 설정을 초기화하시겠습니까?')) return
    const defaults = {
      provider: 'openai', model: 'gpt-4o-mini', temperature: 0.7,
      maxTokens: 2000, streamResponse: true,
      systemPrompt: '당신은 도움이 되는 AI 어시스턴트입니다. 친절하고 정확하게 답변해주세요.',
      theme: 'light' as const, language: 'ko' as const,
    }
    updateSettings(defaults)
    setLocal((p) => ({ ...p, ...defaults }))
    showToast('success', '설정이 초기화되었습니다.')
  }

  const maskKey = (key: string) =>
    key ? `${key.slice(0, 7)}${'•'.repeat(16)}${key.slice(-4)}` : ''

  // 데이터 관리
  const userMsgCount = messages.filter((m) => m.role === 'user').length
  const aiMsgCount   = messages.filter((m) => m.role === 'assistant').length
  const storageBytes = new Blob([JSON.stringify(messages)]).size
  const storageLabel =
    storageBytes < 1024 ? `${storageBytes} B`
    : storageBytes < 1024 * 1024 ? `${(storageBytes / 1024).toFixed(1)} KB`
    : `${(storageBytes / 1024 / 1024).toFixed(2)} MB`

  const handleExport = () => {
    const data = { exportedAt: new Date().toISOString(), provider: settings.provider, model: settings.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content, timestamp: m.timestamp })) }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `chatbot-history-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
    showToast('success', '대화 내역이 내보내기되었습니다.')
  }

  const handleClearAll = () => {
    if (!confirm('모든 대화 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    clearMessages(); resetTokens()
    showToast('success', '모든 데이터가 삭제되었습니다.')
  }

  // 사용량 통계
  const TOKEN_LIMIT = 100_000
  const usagePct = Math.min((totalTokensUsed / TOKEN_LIMIT) * 100, 100)
  const modelDef = getModel(settings.provider, settings.model)
  const costPer1k = modelDef?.costPer1k ?? 0.002
  const estimatedCost = ((totalTokensUsed / 1000) * costPer1k).toFixed(4)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-blue-500 rounded-xl shadow">
          <SettingsIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--fg)' }}>설정</h1>
          <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>API 키 및 챗봇 환경 설정</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border animate-slideUp ${
          toast.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* ── API 키 설정 ───────────────────────────────────── */}
      <Section icon={Key} title="API 키 설정" desc="사용할 AI 서비스를 선택하고 API 키를 입력하세요">
        <div className="space-y-4">

          {/* Provider 선택 */}
          <div>
            <Label required>AI 서비스 (Provider)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PROVIDERS.map((p) => (
                <button key={p.id} type="button"
                  onClick={() => setLocal((prev) => ({ ...prev, provider: p.id, model: p.models[0].value }))}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left text-sm font-medium transition-all ${
                    local.provider === p.id
                      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'hover:border-blue-300 dark:hover:border-slate-500'
                  }`}
                  style={local.provider !== p.id ? { borderColor: 'var(--card-border)', color: 'var(--fg)' } : {}}
                >
                  {p.badge && <span className="text-base leading-none">{p.badge}</span>}
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* API Key 입력 */}
          <div>
            <Label required>API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <InputField
                  type={showKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => { setTempApiKey(e.target.value); setValidation('idle') }}
                  placeholder={currentProvider.apiKeyPlaceholder}
                  className={
                    validation === 'valid' ? '!border-green-400 !ring-green-400/20'
                    : validation === 'invalid' ? '!border-red-400 !ring-red-400/20' : ''
                  }
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--muted-fg)' }}>
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button onClick={handleSaveApiKey} disabled={validation === 'validating'}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm flex-shrink-0">
                {validation === 'validating'
                  ? <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />검증 중</>
                  : <><Save className="h-4 w-4" />저장</>}
              </button>
            </div>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {validation === 'valid' && (
                <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle className="h-3.5 w-3.5" /> 유효한 API 키
                </span>
              )}
              {validation === 'invalid' && (
                <span className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3.5 w-3.5" /> 유효하지 않은 API 키
                </span>
              )}
              {validation === 'idle' && (
                <span className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                  API 키는 로컬에만 저장되며, 새로고침 시 초기화됩니다
                </span>
              )}
              <a href={currentProvider.apiKeyLink} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-blue-500 hover:underline ml-auto">
                키 발급하기 <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {settings.apiKey && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
                현재 저장된 키: <span className="font-mono">{maskKey(settings.apiKey)}</span>
              </p>
            )}
          </div>

          <div className="rounded-xl p-3 text-xs space-y-1"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-fg)' }}>
            <p className="font-medium" style={{ color: 'var(--fg)' }}>{currentProvider.apiKeyHint}</p>
          </div>
        </div>
      </Section>

      {/* ── 모델 설정 ────────────────────────────────────── */}
      <Section icon={Brain} title="모델 설정" desc="사용할 AI 모델과 응답 파라미터를 설정하세요">
        <div className="space-y-4">

          <div>
            <Label>모델 선택</Label>
            <SelectField value={local.model}
              onChange={(e) => setLocal((p) => ({ ...p, model: e.target.value }))}>
              {currentProvider.models.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </SelectField>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
              {currentProvider.models.find((m) => m.value === local.model)?.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>창의성 (Temperature)</Label>
              <div className="space-y-2">
                <InputField type="range" min="0" max="2" step="0.1"
                  value={local.temperature}
                  onChange={(e) => setLocal((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                  className="!px-0 !py-0 !border-0 !bg-transparent !ring-0 accent-blue-500 w-full h-8"
                />
                <div className="flex justify-between text-xs" style={{ color: 'var(--muted-fg)' }}>
                  <span>정확 (0)</span>
                  <span className="font-medium text-blue-500">{local.temperature.toFixed(1)}</span>
                  <span>창의 (2)</span>
                </div>
              </div>
            </div>
            <div>
              <Label>최대 토큰</Label>
              <InputField type="number" value={local.maxTokens}
                onChange={(e) => setLocal((p) => ({ ...p, maxTokens: parseInt(e.target.value) || 100 }))}
                min={100} max={32000} />
              <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>100 ~ 32000</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>스트리밍 응답</p>
              <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>실시간으로 응답을 표시합니다</p>
            </div>
            <button type="button"
              onClick={() => setLocal((p) => ({ ...p, streamResponse: !p.streamResponse }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${local.streamResponse ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${local.streamResponse ? 'translate-x-5' : ''}`} />
            </button>
          </div>
        </div>
      </Section>

      {/* ── 일반 설정 ────────────────────────────────────── */}
      <Section icon={Sliders} title="일반 설정" desc="언어, 테마, 시스템 프롬프트를 설정하세요">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>언어</Label>
              <SelectField value={local.language}
                onChange={(e) => setLocal((p) => ({ ...p, language: e.target.value as 'ko' | 'en' }))}>
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </SelectField>
            </div>
            <div>
              <Label>테마</Label>
              <SelectField value={local.theme}
                onChange={(e) => setLocal((p) => ({ ...p, theme: e.target.value as 'light' | 'dark' | 'system' }))}>
                <option value="light">라이트</option>
                <option value="dark">다크</option>
                <option value="system">시스템 설정</option>
              </SelectField>
            </div>
          </div>
          <div>
            <Label>시스템 프롬프트</Label>
            <textarea value={local.systemPrompt}
              onChange={(e) => setLocal((p) => ({ ...p, systemPrompt: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--input-border)', color: 'var(--fg)' }}
              placeholder="AI 어시스턴트의 역할과 행동 방침을 설명하세요..."
            />
            <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>AI의 성격과 응답 방식을 정의합니다</p>
          </div>
        </div>
      </Section>

      {/* ── 데이터 관리 ──────────────────────────────────── */}
      <Section icon={Database} title="데이터 관리" desc="저장된 대화 내역을 관리하고 백업하세요">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '전체 메시지', value: userMsgCount + aiMsgCount, color: 'text-blue-500' },
              { label: '내 메시지',   value: userMsgCount,              color: 'text-green-500' },
              { label: '저장 용량',   value: storageLabel,              color: 'text-purple-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center py-4 rounded-xl border"
                style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--muted)' }}>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-fg)' }}>{label}</p>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <button onClick={handleExport} disabled={messages.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl border transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 hover:border-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--card-border)', color: 'var(--fg)' }}>
              <Download className="h-4 w-4" />대화 내역 내보내기 (JSON)
            </button>
            <button onClick={handleClearAll} disabled={messages.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl border transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: 'var(--card-border)', color: 'var(--fg)' }}>
              <Trash2 className="h-4 w-4" />모든 대화 내역 삭제
            </button>
          </div>
        </div>
      </Section>

      {/* ── 사용량 통계 ──────────────────────────────────── */}
      <Section icon={BarChart2} title="사용량 통계" desc="토큰 사용량과 예상 비용을 확인하세요">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span style={{ color: 'var(--fg)' }}>누적 토큰 사용량</span>
              <span className="font-semibold" style={{ color: 'var(--fg)' }}>
                {totalTokensUsed.toLocaleString()} / {TOKEN_LIMIT.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
              <div className={`h-full rounded-full transition-all duration-500 ${
                usagePct > 80 ? 'bg-red-500' : usagePct > 50 ? 'bg-amber-400' : 'bg-blue-500'
              }`} style={{ width: `${usagePct}%` }} />
            </div>
            <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
              <span>{usagePct.toFixed(1)}% 사용</span>
              <span>한도 100,000 tokens</span>
            </div>
          </div>

          <div className="rounded-xl p-4 space-y-3 border"
            style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--muted)' }}>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted-fg)' }}>현재 서비스</span>
              <span className="font-medium" style={{ color: 'var(--fg)' }}>
                {getProvider(settings.provider).badge} {getProvider(settings.provider).name}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted-fg)' }}>사용 모델</span>
              <span className="font-medium" style={{ color: 'var(--fg)' }}>{settings.model}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted-fg)' }}>1K 토큰당 요금</span>
              <span className="font-medium" style={{ color: 'var(--fg)' }}>${costPer1k.toFixed(5)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between text-sm"
              style={{ borderColor: 'var(--card-border)' }}>
              <span className="font-medium" style={{ color: 'var(--fg)' }}>예상 비용</span>
              <span className="font-bold text-blue-500">${estimatedCost}</span>
            </div>
          </div>

          <button onClick={() => {
            if (!confirm('토큰 사용량 기록을 초기화하시겠습니까?')) return
            resetTokens(); showToast('success', '사용량 통계가 초기화되었습니다.')
          }} className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-xl border transition-all hover:bg-slate-50 dark:hover:bg-slate-700"
            style={{ borderColor: 'var(--card-border)', color: 'var(--muted-fg)' }}>
            <RefreshCw className="h-3.5 w-3.5" />사용량 통계 초기화
          </button>
        </div>
      </Section>

      {/* ── 저장/초기화 ──────────────────────────────────── */}
      <div className="flex gap-3">
        <button onClick={handleSaveGeneral}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md">
          <Save className="h-4 w-4" />설정 저장
        </button>
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-300"
          style={{ borderColor: 'var(--card-border)', color: 'var(--muted-fg)' }}>
          <RefreshCw className="h-4 w-4" />초기화
        </button>
      </div>
    </div>
  )
}
