import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  tokens?: number
}

export interface AppSettings {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  theme: 'light' | 'dark' | 'system'
  language: 'ko' | 'en'
  streamResponse: boolean
}

interface AppStore {
  messages: Message[]
  isLoading: boolean
  settings: AppSettings
  totalTokensUsed: number
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void
  updateLastMessage: (content: string) => void
  clearMessages: () => void
  setLoading: (v: boolean) => void
  updateSettings: (partial: Partial<AppSettings>) => void
  addTokens: (count: number) => void
  resetTokens: () => void
}

const defaultSettings: AppSettings = {
  apiKey: '',
  model: 'gpt-3.5-turbo',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: '당신은 도움이 되는 AI 어시스턴트입니다. 친절하고 정확하게 답변해주세요.',
  theme: 'light',
  language: 'ko',
  streamResponse: true,
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      settings: defaultSettings,
      totalTokensUsed: 0,

      addMessage: (msg) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...msg,
              id: crypto.randomUUID(),
              timestamp: new Date(),
            },
          ],
        })),

      updateLastMessage: (content) =>
        set((state) => {
          const msgs = [...state.messages]
          if (msgs.length > 0) {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
          }
          return { messages: msgs }
        }),

      clearMessages: () => set({ messages: [] }),

      setLoading: (v) => set({ isLoading: v }),

      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      addTokens: (count) =>
        set((state) => ({ totalTokensUsed: state.totalTokensUsed + count })),

      resetTokens: () => set({ totalTokensUsed: 0 }),
    }),
    {
      name: 'chatbot-storage',
      partialize: (state) => ({
        settings: state.settings,
        messages: state.messages,
        totalTokensUsed: state.totalTokensUsed,
      }),
    }
  )
)
