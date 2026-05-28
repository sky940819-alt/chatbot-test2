import { useState, useEffect } from 'react'
import {
  Key, Save, Eye, EyeOff, CheckCircle, AlertCircle, Settings as SettingsIcon,
  Sliders, RefreshCw, Brain, ChevronDown
} from 'lucide-react'
import { useAppStore } from '@/store'
import { validateApiKey } from '@/services/openai.service'

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

const MODELS = [
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', desc: '빠르고 효율적, 일상적인 작업에 적합' },
  { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K', desc: '긴 문서 처리에 적합한 확장 컨텍스트' },
  { value: 'gpt-4', label: 'GPT-4', desc: '높은 정확도, 복잡한 추론 및 코딩에 적합' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'GPT-4보다 빠르고 저렴한 최신 모델' },
  { value: 'gpt-4o', label: 'GPT-4o', desc: '텍스트·이미지 모두 처리 가능한 멀티모달 모델' },
  { value: 'gpt-4o-mini', label: 'GPT-4o mini', desc: '소형 고성능 모델, 비용 효율 최고' },
]

function Section({ title, desc, icon: Icon, children }: {
  title: string; desc: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--card-border)' }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: 'var(--card-border)', backgroundColor: 'var(--muted)' }}
      >
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
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function InputField({
  type = 'text', value, onChange, placeholder, disabled, className = '', ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 ${className}`}
      style={{
        backgroundColor: 'var(--input-bg)',
        borderColor: 'var(--input-border)',
        color: 'var(--fg)',
      }}
      {...rest}
    />
  )
}

function SelectField({
  value, onChange, children, disabled
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none appearance-none transition-all focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 disabled:opacity-50 pr-9"
        style={{
          backgroundColor: 'var(--input-bg)',
          borderColor: 'var(--input-border)',
          color: 'var(--fg)',
        }}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--muted-fg)' }} />
    </div>
  )
}

export function Settings() {
  const { settings, updateSettings } = useAppStore()

  const [tempApiKey, setTempApiKey] = useState(settings.apiKey)
  const [showKey, setShowKey] = useState(false)
  const [validation, setValidation] = useState<ValidationState>(
    settings.apiKey ? 'valid' : 'idle'
  )
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [local, setLocal] = useState({ ...settings })

  useEffect(() => {
    setLocal({ ...settings })
  }, [settings])

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveApiKey = async () => {
    const key = tempApiKey.trim()
    if (!key) {
      showToast('error', 'API 키를 입력해주세요.')
      return
    }
    if (!key.startsWith('sk-')) {
      showToast('error', 'API 키는 sk- 로 시작해야 합니다.')
      setValidation('invalid')
      return
    }

    setValidation('validating')
    const result = await validateApiKey(key)
    if (result.valid) {
      updateSettings({ apiKey: key })
      setValidation('valid')
      showToast('success', 'API 키가 저장되었습니다.')
    } else {
      setValidation('invalid')
      showToast('error', result.error || 'API 키가 유효하지 않습니다.')
    }
  }

  const handleSaveGeneral = () => {
    updateSettings({
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
    updateSettings({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      streamResponse: true,
      systemPrompt: '당신은 도움이 되는 AI 어시스턴트입니다. 친절하고 정확하게 답변해주세요.',
      theme: 'light',
      language: 'ko',
    })
    setLocal({
      ...settings,
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      streamResponse: true,
      systemPrompt: '당신은 도움이 되는 AI 어시스턴트입니다. 친절하고 정확하게 답변해주세요.',
      theme: 'light',
      language: 'ko',
    })
    showToast('success', '설정이 초기화되었습니다.')
  }

  const maskKey = (key: string) => key ? `${key.slice(0, 7)}${'•'.repeat(20)}${key.slice(-4)}` : ''

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fadeIn">
      {/* Page title */}
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
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm border animate-slideUp ${
            toast.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
          }`}
        >
          {toast.type === 'success'
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* API Key Section */}
      <Section icon={Key} title="API 키 설정" desc="OpenAI API 키를 입력하여 챗봇을 활성화하세요">
        <div className="space-y-4">
          <div>
            <Label required>OpenAI API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <InputField
                  type={showKey ? 'text' : 'password'}
                  value={tempApiKey}
                  onChange={(e) => {
                    setTempApiKey(e.target.value)
                    setValidation('idle')
                  }}
                  placeholder="sk-..."
                  className={
                    validation === 'valid'
                      ? '!border-green-400 !ring-green-400/20'
                      : validation === 'invalid'
                      ? '!border-red-400 !ring-red-400/20'
                      : ''
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--muted-fg)' }}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSaveApiKey}
                disabled={validation === 'validating'}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md flex-shrink-0"
              >
                {validation === 'validating' ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    검증 중
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                )}
              </button>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 mt-2">
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
                  API 키는 로컬에만 저장됩니다
                </span>
              )}
            </div>

            {settings.apiKey && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
                현재 저장된 키: <span className="font-mono">{maskKey(settings.apiKey)}</span>
              </p>
            )}
          </div>

          <div
            className="rounded-xl p-3 text-xs space-y-1"
            style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-fg)' }}
          >
            <p className="font-medium" style={{ color: 'var(--fg)' }}>API 키 발급 방법</p>
            <p>1. platform.openai.com 접속 후 로그인</p>
            <p>2. API Keys 메뉴 → Create new secret key</p>
            <p>3. 생성된 키를 복사하여 위 입력란에 붙여넣기</p>
          </div>
        </div>
      </Section>

      {/* Model Settings */}
      <Section icon={Brain} title="모델 설정" desc="사용할 AI 모델과 응답 파라미터를 설정하세요">
        <div className="space-y-4">
          <div>
            <Label>모델 선택</Label>
            <SelectField
              value={local.model}
              onChange={(e) => setLocal((p) => ({ ...p, model: e.target.value }))}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </SelectField>
            <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
              {MODELS.find((m) => m.value === local.model)?.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>창의성 (Temperature)</Label>
              <div className="space-y-2">
                <InputField
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
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
              <InputField
                type="number"
                value={local.maxTokens}
                onChange={(e) => setLocal((p) => ({ ...p, maxTokens: parseInt(e.target.value) || 100 }))}
                min={100}
                max={16000}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>100 ~ 16000</p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>스트리밍 응답</p>
              <p className="text-xs" style={{ color: 'var(--muted-fg)' }}>
                실시간으로 응답을 표시합니다
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLocal((p) => ({ ...p, streamResponse: !p.streamResponse }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                local.streamResponse ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  local.streamResponse ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </Section>

      {/* General Settings */}
      <Section icon={Sliders} title="일반 설정" desc="언어, 테마, 시스템 프롬프트를 설정하세요">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>언어</Label>
              <SelectField
                value={local.language}
                onChange={(e) => setLocal((p) => ({ ...p, language: e.target.value as 'ko' | 'en' }))}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </SelectField>
            </div>
            <div>
              <Label>테마</Label>
              <SelectField
                value={local.theme}
                onChange={(e) => setLocal((p) => ({ ...p, theme: e.target.value as 'light' | 'dark' | 'system' }))}
              >
                <option value="light">라이트</option>
                <option value="dark">다크</option>
                <option value="system">시스템 설정</option>
              </SelectField>
            </div>
          </div>

          <div>
            <Label>시스템 프롬프트</Label>
            <textarea
              value={local.systemPrompt}
              onChange={(e) => setLocal((p) => ({ ...p, systemPrompt: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none transition-all focus:border-blue-400 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--fg)',
              }}
              placeholder="AI 어시스턴트의 역할과 행동 방침을 설명하세요..."
            />
            <p className="text-xs mt-1" style={{ color: 'var(--muted-fg)' }}>
              AI의 성격과 응답 방식을 정의합니다
            </p>
          </div>
        </div>
      </Section>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveGeneral}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
        >
          <Save className="h-4 w-4" />
          설정 저장
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-xl border transition-all hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 hover:border-red-300"
          style={{ borderColor: 'var(--card-border)', color: 'var(--muted-fg)' }}
        >
          <RefreshCw className="h-4 w-4" />
          초기화
        </button>
      </div>
    </div>
  )
}
