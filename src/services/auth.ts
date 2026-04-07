import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models'
import { getJWTConfig } from '../config'
import type { IUser } from '../models'

interface AccessTokenPayload {
  userId: string
  email: string
  type: 'access'
}

interface RefreshTokenPayload {
  userId: string
  type: 'refresh'
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static generateAccessToken(user: IUser): string {
    const jwtConfig = getJWTConfig()
    const payload: AccessTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      type: 'access',
    }

    return jwt.sign(payload, jwtConfig.SECRET, {
      expiresIn: '15m',
    })
  }

  static generateRefreshToken(user: IUser): string {
    const jwtConfig = getJWTConfig()
    const payload: RefreshTokenPayload = {
      userId: user._id.toString(),
      type: 'refresh',
    }

    return jwt.sign(payload, jwtConfig.SECRET, {
      expiresIn: '7d',
    })
  }

  static verifyAccessToken(token: string): AccessTokenPayload {
    const jwtConfig = getJWTConfig()
    const decoded = jwt.verify(token, jwtConfig.SECRET) as AccessTokenPayload
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type')
    }
    
    return decoded
  }

  static verifyRefreshToken(token: string): RefreshTokenPayload {
    const jwtConfig = getJWTConfig()
    const decoded = jwt.verify(token, jwtConfig.SECRET) as RefreshTokenPayload
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type')
    }
    
    return decoded
  }

  static async addRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $addToSet: { refreshTokens: refreshToken },
    })
  }

  static async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    })
  }

  static async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    })
  }

  static async isRefreshTokenValid(userId: string, refreshToken: string): Promise<boolean> {
    const user = await User.findById(userId)
    return user?.refreshTokens.includes(refreshToken) || false
  }

  static async signup(email: string, password: string, name: string) {
    const existingUser = await User.findOne({ email: email.toLowerCase() })

    if (existingUser) {
      throw new Error('User already exists')
    }

    const hashedPassword = await this.hashPassword(password)

    const user = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      refreshTokens: [],
    })

    await user.save()

    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    await this.addRefreshToken(user._id.toString(), refreshToken)

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    }
  }

  static async login(email: string, password: string) {
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    const isValidPassword = await this.comparePassword(password, user.password)

    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    const accessToken = this.generateAccessToken(user)
    const refreshToken = this.generateRefreshToken(user)

    await this.addRefreshToken(user._id.toString(), refreshToken)

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      accessToken,
      refreshToken,
    }
  }

  static async refresh(refreshToken: string) {
    try {
      const payload = this.verifyRefreshToken(refreshToken)
      const isValid = await this.isRefreshTokenValid(payload.userId, refreshToken)

      if (!isValid) {
        throw new Error('Refresh token not valid')
      }

      const user = await User.findById(payload.userId)

      if (!user) {
        throw new Error('User not found')
      }

      const accessToken = this.generateAccessToken(user)
      const newRefreshToken = this.generateRefreshToken(user)

      await this.removeRefreshToken(payload.userId, refreshToken)
      await this.addRefreshToken(payload.userId, newRefreshToken)

      return {
        accessToken,
        refreshToken: newRefreshToken,
      }
    } catch {
      throw new Error('Invalid refresh token')
    }
  }

  static async logout(userId: string, refreshToken: string) {
    await this.removeRefreshToken(userId, refreshToken)
  }

  static async logoutAll(userId: string) {
    await this.removeAllRefreshTokens(userId)
  }

  static async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password -refreshTokens')

    if (!user) {
      throw new Error('User not found')
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    }
  }
}
