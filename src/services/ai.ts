import { getAIConfig } from '../config'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

const SYSTEM_PROMPT = `You are Sahilion AI, an advanced intelligent chatbot created by Sahil Analytics.

Your goal is to provide fast, accurate, and helpful responses to users. 
Be friendly, smart, and professional.

Rules:
- Always give clear and helpful answers
- Keep responses short but informative
- Use simple language
- Help with coding, AI, tech, and general questions
- If unsure, say "I'll help you figure that out"

Tone:
- Friendly
- Confident
- Intelligent

Identity:
- Name: Sahilion AI
- Creator: Sahil Analytics`

class AIService {
  private apiKey: string
  private provider: string
  private demoMode: boolean

  constructor() {
    const aiConfig = getAIConfig()
    this.apiKey = aiConfig.GROQ_API_KEY || ''
    this.provider = aiConfig.PROVIDER
    this.demoMode = aiConfig.DEMO_MODE
  }

  async *streamResponse(messages: Message[]): AsyncGenerator<string, void, unknown> {
    if (this.demoMode || !this.apiKey) {
      yield* this.demoResponse()
      return
    }

    if (this.provider === 'groq') {
      yield* this.groqStream(messages)
    } else {
      yield* this.openaiStream(messages)
    }
  }

  private async *groqStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    const url = 'https://api.groq.com/openai/v1/chat/completions'

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.slice(-20),
        ],
        stream: true,
        max_tokens: 4096,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Groq API error: ${error}`)
    }

    if (!response.body) {
      throw new Error('No response body')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          if (data === '[DONE]') {
            return
          }

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content

            if (content) {
              yield content
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async *openaiStream(messages: Message[]): AsyncGenerator<string, void, unknown> {
    yield* this.groqStream(messages)
  }

  private async *demoResponse(): AsyncGenerator<string, void, unknown> {
    const responses = [
      "Hello! I'm Sahilion AI, your advanced intelligent assistant.",
      " I can help you with a wide range of tasks.",
      "\n\n",
      "• Writing and editing code",
      "\n• Explaining complex topics",
      "\n• Brainstorming new ideas",
      "\n• Problem-solving and analysis",
      "\n\n",
      "What would you like to explore today?",
    ]

    for (const chunk of responses) {
      await new Promise((resolve) => setTimeout(resolve, 50 + Math.random() * 100))
      yield chunk
    }
  }

  getFullResponse(messages: Message[]): Promise<string> {
    return new Promise(async (resolve) => {
      let fullResponse = ''
      try {
        for await (const chunk of this.streamResponse(messages)) {
          fullResponse += chunk
        }
      } catch (error) {
        console.error('AI error:', error)
        fullResponse = 'Sorry, I encountered an error.'
      }
      resolve(fullResponse)
    })
  }
}

export const aiService = new AIService()
