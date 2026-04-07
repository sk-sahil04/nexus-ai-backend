import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import { User } from '../models'
import { getJWTConfig } from '../config'
import type { IUser } from '../models'

interface TokenPayload {
  userId: string
  email: string
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static generateToken(user: IUser): string {
    const jwtConfig = getJWTConfig()
    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
    }

    const options: SignOptions = {
      expiresIn: jwtConfig.EXPIRES_IN as jwt.SignOptions['expiresIn'],
    }

    return jwt.sign(payload, jwtConfig.SECRET, options)
  }

  static verifyToken(token: string): TokenPayload {
    const jwtConfig = getJWTConfig()
    return jwt.verify(token, jwtConfig.SECRET) as TokenPayload
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
    })

    await user.save()

    const token = this.generateToken(user)

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
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

    const token = this.generateToken(user)

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
      token,
    }
  }

  static async getUserById(userId: string) {
    const user = await User.findById(userId).select('-password')

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
