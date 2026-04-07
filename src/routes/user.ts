import { Router, Response } from 'express'
import { AuthService } from '../services'
import { authenticate, AuthRequest } from '../middleware'

const router = Router()

router.get(
  '/me',
  authenticate,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const user = await AuthService.getUserById(req.user!.id)

      res.json({
        success: true,
        user,
      })
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: error.message,
      })
    }
  }
)

export default router
