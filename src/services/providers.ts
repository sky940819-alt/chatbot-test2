export interface ModelDef {
  value: string
  label: string
  desc: string
  costPer1k: number
}

export interface ProviderDef {
  id: string
  name: string
  badge?: string
  apiKeyPlaceholder: string
  apiKeyHint: string
  apiKeyLink: string
  models: ModelDef[]
}

export const PROVIDERS: ProviderDef[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    apiKeyPlaceholder: 'sk-...',
    apiKeyHint: 'platform.openai.com → API Keys',
    apiKeyLink: 'https://platform.openai.com/api-keys',
    models: [
      { value: 'gpt-4.1',          label: 'GPT-4.1',          desc: '최신 플래그십 · 최고 성능',         costPer1k: 0.002  },
      { value: 'gpt-4.1-mini',     label: 'GPT-4.1 mini',     desc: '빠르고 경제적인 최신 모델',          costPer1k: 0.0004 },
      { value: 'gpt-4.1-nano',     label: 'GPT-4.1 nano',     desc: '초경량 · 초저렴',                   costPer1k: 0.0001 },
      { value: 'gpt-4o',           label: 'GPT-4o',           desc: '멀티모달 지원 오음니 모델',           costPer1k: 0.005  },
      { value: 'gpt-4o-mini',      label: 'GPT-4o mini',      desc: '최고 비용효율 소형 모델',            costPer1k: 0.00015},
      { value: 'gpt-4-turbo',      label: 'GPT-4 Turbo',      desc: '강력한 추론 · 128k 컨텍스트',        costPer1k: 0.01   },
      { value: 'gpt-4',            label: 'GPT-4',            desc: '안정적인 고성능',                    costPer1k: 0.03   },
      { value: 'gpt-3.5-turbo',    label: 'GPT-3.5 Turbo',    desc: '빠르고 저렴한 범용 모델',            costPer1k: 0.002  },
      { value: 'o1',               label: 'o1',               desc: '최고급 추론 모델 (느림)',             costPer1k: 0.015  },
      { value: 'o1-mini',          label: 'o1-mini',          desc: '추론 특화 소형 모델',                costPer1k: 0.003  },
      { value: 'o3-mini',          label: 'o3-mini',          desc: '최신 추론 모델 · STEM 특화',         costPer1k: 0.0011 },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    apiKeyPlaceholder: 'sk-ant-api03-...',
    apiKeyHint: 'console.anthropic.com → API Keys',
    apiKeyLink: 'https://console.anthropic.com/settings/keys',
    models: [
      { value: 'claude-opus-4-5',              label: 'Claude Opus 4.5',       desc: '최고급 플래그십 · 복잡한 작업',     costPer1k: 0.015  },
      { value: 'claude-sonnet-4-5',            label: 'Claude Sonnet 4.5',     desc: '최신 균형 모델 · 고성능',           costPer1k: 0.003  },
      { value: 'claude-haiku-4-5',             label: 'Claude Haiku 4.5',      desc: '빠른 응답 · 경량',                  costPer1k: 0.00025},
      { value: 'claude-3-5-sonnet-20241022',   label: 'Claude 3.5 Sonnet',     desc: '코딩·분석 특화',                    costPer1k: 0.003  },
      { value: 'claude-3-5-haiku-20241022',    label: 'Claude 3.5 Haiku',      desc: '빠르고 저렴',                       costPer1k: 0.0008 },
      { value: 'claude-3-opus-20240229',       label: 'Claude 3 Opus',         desc: '강력한 추론 · 구세대 플래그십',      costPer1k: 0.015  },
    ],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    apiKeyPlaceholder: 'AIzaSy...',
    apiKeyHint: 'aistudio.google.com → Get API key',
    apiKeyLink: 'https://aistudio.google.com/app/apikey',
    models: [
      { value: 'gemini-2.5-pro-preview-05-06',   label: 'Gemini 2.5 Pro',     desc: '최고 성능 멀티모달 추론',            costPer1k: 0.00125},
      { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash',   desc: '빠른 멀티모달',                     costPer1k: 0.0003 },
      { value: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash',   desc: '효율적이고 빠른 최신 모델',          costPer1k: 0.0001 },
      { value: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro',     desc: '100만 토큰 컨텍스트',               costPer1k: 0.00125},
      { value: 'gemini-1.5-flash',               label: 'Gemini 1.5 Flash',   desc: '빠르고 저렴',                       costPer1k: 0.000075},
    ],
  },
  {
    id: 'upstage',
    name: 'Upstage Solar',
    badge: '🇰🇷',
    apiKeyPlaceholder: 'up_...',
    apiKeyHint: 'console.upstage.ai → API Keys (국내 기업)',
    apiKeyLink: 'https://console.upstage.ai/api-keys',
    models: [
      { value: 'solar-pro',   label: 'Solar Pro',   desc: '한국어 최적화 고성능 · 세계 최고 수준',  costPer1k: 0.0011  },
      { value: 'solar-mini',  label: 'Solar Mini',  desc: '한국어 최적화 경량 · 빠른 응답',         costPer1k: 0.00015 },
    ],
  },
  {
    id: 'clova',
    name: 'NAVER CLOVA X',
    badge: '🇰🇷',
    apiKeyPlaceholder: 'NTA0M...',
    apiKeyHint: 'clovastudio.naver.com → API 키 발급 (국내 기업)',
    apiKeyLink: 'https://clovastudio.naver.com',
    models: [
      { value: 'HCX-003',      label: 'HyperCLOVA X',       desc: '네이버 최강 · 한국어 1위 특화',     costPer1k: 0.005  },
      { value: 'HCX-DASH-001', label: 'HyperCLOVA X DASH',  desc: '빠른 응답 경량 모델',               costPer1k: 0.001  },
    ],
  },
]

export const PROVIDER_MAP = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]))

export function getProvider(id: string): ProviderDef {
  return PROVIDER_MAP[id] ?? PROVIDERS[0]
}

export function getModel(providerId: string, modelId: string): ModelDef | undefined {
  return getProvider(providerId).models.find((m) => m.value === modelId)
}
