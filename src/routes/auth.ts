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

export default router
