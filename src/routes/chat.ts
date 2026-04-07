import { Router, Request, Response } from 'express'
import { authenticate, chatLimiter, AuthRequest, validate } from '../middleware'
import { sendMessageSchema, createChatSchema } from '../validations'
import { aiService, ChatService } from '../services'

const router = Router()

router.post(
  '/',
  authenticate,
  chatLimiter,
  validate(sendMessageSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { chatId, message } = req.body
      const userId = req.user!.id

      let currentChatId = chatId

      if (!currentChatId) {
        const newChat = await ChatService.createChat(userId, message.slice(0, 50) + (message.length > 50 ? '...' : ''))
        currentChatId = newChat.id
      }

      await ChatService.addMessage(currentChatId, userId, 'user', message)

      const chat = await ChatService.getChatById(currentChatId, userId)

      const aiMessages = chat.messages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      res.setHeader('Content-Type', 'text/plain')
      res.setHeader('Transfer-Encoding', 'chunked')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')

      let fullResponse = ''

      try {
        for await (const chunk of aiService.streamResponse(aiMessages)) {
          fullResponse += chunk
          res.write(chunk)
        }

        await ChatService.addMessage(currentChatId, userId, 'assistant', fullResponse)
      } catch (aiError) {
        console.error('AI streaming error:', aiError)
        if (!res.headersSent) {
          res.status(500).json({ error: 'AI processing failed' })
        }
      }

      if (!res.writableEnded) {
        res.end()
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error.message || 'Chat processing failed',
        })
      }
    }
  }
)

export default router
