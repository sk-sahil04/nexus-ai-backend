import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const sendMessageSchema = z.object({
  chatId: z.string().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
})

export const createChatSchema = z.object({
  title: z.string().min(1).max(100).optional(),
})

export const renameChatSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type CreateChatInput = z.infer<typeof createChatSchema>
export type RenameChatInput = z.infer<typeof renameChatSchema>
