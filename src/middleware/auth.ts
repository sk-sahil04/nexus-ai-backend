import { Request, Response, NextFunction } from 'express'
import { AuthService } from '../services'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
  }
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded = AuthService.verifyAccessToken(token)
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      }
      
      next()
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' })
  }
}

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.split(' ')[1]

    try {
      const decoded = AuthService.verifyAccessToken(token)
      
      req.user = {
        id: decoded.userId,
        email: decoded.email,
      }
    } catch {
      // Token invalid, continue without user
    }

    next()
  } catch {
    next()
  }
}
