import { Router, Response } from 'express'
import { ChatService } from '../services'
import { authenticate, chatLimiter, AuthRequest, validate } from '../middleware'
import { createChatSchema, renameChatSchema, sendMessageSchema } from '../validations'
import { aiService } from '../services'

const router = Router()

router.get(
  '/',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const chats = await ChatService.getUserChats(req.user!.id)

      res.json({
        success: true,
        chats,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }
)

router.post(
  '/',
  authenticate,
  chatLimiter,
  validate(createChatSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title } = req.body
      const chat = await ChatService.createChat(req.user!.id, title)

      res.status(201).json({
        success: true,
        chat,
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      })
    }
  }
)

router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const chat = await ChatService.getChatById(req.params.id, req.user!.id)

      res.json({
        success: true,
        chat,
      })
    } catch (error: any) {
      const statusCode = error.message === 'Chat not found' ? 404 : 500
      res.status(statusCode).json({
        success: false,
        error: error.message,
      })
    }
  }
)

router.patch(
  '/:id',
  authenticate,
  validate(renameChatSchema),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title } = req.body
      const chat = await ChatService.renameChat(req.params.id, req.user!.id, title)

      res.json({
        success: true,
        chat,
      })
    } catch (error: any) {
      const statusCode = error.message === 'Chat not found' ? 404 : 500
      res.status(statusCode).json({
        success: false,
        error: error.message,
      })
    }
  }
)

router.delete(
  '/:id',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await ChatService.deleteChat(req.params.id, req.user!.id)

      res.json({
        success: true,
        message: 'Chat deleted successfully',
      })
    } catch (error: any) {
      const statusCode = error.message === 'Chat not found' ? 404 : 500
      res.status(statusCode).json({
        success: false,
        error: error.message,
      })
    }
  }
)

export default router
