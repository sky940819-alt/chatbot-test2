import type { Message } from '@/store'
import * as openai from './openai.service'
import * as anthropic from './anthropic.service'
import * as gemini from './gemini.service'
import * as clova from './clova.service'

type ChatMsg = Pick<Message, 'role' | 'content'>

export async function validateApiKey(
  apiKey: string,
  provider: string
): Promise<{ valid: boolean; error?: string }> {
  switch (provider) {
    case 'anthropic': return anthropic.validateApiKey(apiKey)
    case 'google':    return gemini.validateApiKey(apiKey)
    case 'clova':     return clova.validateApiKey(apiKey)
    case 'upstage':   return openai.validateApiKey(apiKey, 'upstage')
    default:          return openai.validateApiKey(apiKey, 'openai')
  }
}

export async function sendMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string,
  provider: string
): Promise<string> {
  switch (provider) {
    case 'anthropic': return anthropic.sendMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt)
    case 'google':    return gemini.sendMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt)
    case 'clova':     return clova.sendMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt)
    case 'upstage':   return openai.sendMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt, 'upstage')
    default:          return openai.sendMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt, 'openai')
  }
}

export async function* streamMessage(
  messages: ChatMsg[],
  apiKey: string,
  model: string,
  temperature: number,
  maxTokens: number,
  systemPrompt: string,
  provider: string
): AsyncGenerator<string> {
  switch (provider) {
    case 'anthropic': yield* anthropic.streamMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt); break
    case 'google':    yield* gemini.streamMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt); break
    case 'clova':     yield* clova.streamMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt); break
    case 'upstage':   yield* openai.streamMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt, 'upstage'); break
    default:          yield* openai.streamMessage(messages, apiKey, model, temperature, maxTokens, systemPrompt, 'openai'); break
  }
}
