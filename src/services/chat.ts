import { Chat } from '../models'
import mongoose from 'mongoose'

export class ChatService {
  static async getUserChats(userId: string) {
    const chats = await Chat.find({ userId: new mongoose.Types.ObjectId(userId) })
      .select('title createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean()

    return chats.map((chat) => ({
      id: chat._id.toString(),
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }))
  }

  static async getChatById(chatId: string, userId: string) {
    const chat = await Chat.findOne({
      _id: new mongoose.Types.ObjectId(chatId),
      userId: new mongoose.Types.ObjectId(userId),
    })

    if (!chat) {
      throw new Error('Chat not found')
    }

    return {
      id: chat._id.toString(),
      title: chat.title,
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }
  }

  static async createChat(userId: string, title?: string) {
    const chat = new Chat({
      userId: new mongoose.Types.ObjectId(userId),
      title: title || 'New Chat',
      messages: [],
    })

    await chat.save()

    return {
      id: chat._id.toString(),
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }
  }

  static async renameChat(chatId: string, userId: string, title: string) {
    const chat = await Chat.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(chatId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      { title, updatedAt: new Date() },
      { new: true }
    )

    if (!chat) {
      throw new Error('Chat not found')
    }

    return {
      id: chat._id.toString(),
      title: chat.title,
      updatedAt: chat.updatedAt,
    }
  }

  static async deleteChat(chatId: string, userId: string) {
    const result = await Chat.deleteOne({
      _id: new mongoose.Types.ObjectId(chatId),
      userId: new mongoose.Types.ObjectId(userId),
    })

    if (result.deletedCount === 0) {
      throw new Error('Chat not found')
    }

    return { success: true }
  }

  static async addMessage(
    chatId: string,
    userId: string,
    role: 'user' | 'assistant',
    content: string
  ) {
    const chat = await Chat.findOneAndUpdate(
      {
        _id: new mongoose.Types.ObjectId(chatId),
        userId: new mongoose.Types.ObjectId(userId),
      },
      {
        $push: {
          messages: {
            role,
            content,
            createdAt: new Date(),
          },
        },
        $set: { updatedAt: new Date() },
      },
      { new: true }
    )

    if (!chat) {
      throw new Error('Chat not found')
    }

    return chat.messages[chat.messages.length - 1]
  }
}
