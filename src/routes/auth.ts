import { Router, Request, Response } from 'express'
import { AuthService } from '../services'
import { validate, authLimiter } from '../middleware'
import { signupSchema, loginSchema } from '../validations'

const router = Router()

router.post(
  '/signup',
  authLimiter,
  validate(signupSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name } = req.body

      const result = await AuthService.signup(email, password, name)

      res.status(201).json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      const statusCode = error.message === 'User already exists' ? 409 : 500
      res.status(statusCode).json({
        success: false,
        error: error.message || 'Signup failed',
      })
    }
  }
)

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body

      const result = await AuthService.login(email, password)

      res.json({
        success: true,
        ...result,
      })
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Login failed',
      })
    }
  }
)

router.post(
  '/refresh',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token required',
        })
        return
      }

      const tokens = await AuthService.refresh(refreshToken)

      res.json({
        success: true,
        ...tokens,
      })
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || 'Token refresh failed',
      })
    }
  }
)

router.post(
  '/logout',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken, userId } = req.body

      if (!refreshToken || !userId) {
        res.status(400).json({
          success: false,
          error: 'Refresh token and user ID required',
        })
        return
      }

      await AuthService.logout(userId, refreshToken)

      res.json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Logout failed',
      })
    }
  }
)

router.post(
  '/logout-all',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.body

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID required',
        })
        return
      }

      await AuthService.logoutAll(userId)

      res.json({
        success: true,
        message: 'Logged out from all devices',
      })
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || 'Logout failed',
      })
    }
  }
)

export default router
