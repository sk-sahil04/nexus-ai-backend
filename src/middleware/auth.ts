import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getJWTConfig } from '../config'
import { User } from '../models'

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
    const jwtConfig = getJWTConfig()

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' })
      return
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, jwtConfig.SECRET) as {
      userId: string
      email: string
    }

    const user = await User.findById(decoded.userId).select('_id email')

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' })
      return
    }
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
    const jwtConfig = getJWTConfig()

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next()
      return
    }

    const token = authHeader.split(' ')[1]

    const decoded = jwt.verify(token, jwtConfig.SECRET) as {
      userId: string
      email: string
    }

    const user = await User.findById(decoded.userId).select('_id email')

    if (user) {
      req.user = {
        id: user._id.toString(),
        email: user.email,
      }
    }

    next()
  } catch {
    next()
  }
}
