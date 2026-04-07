import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { config } from 'dotenv'
import { connectDB } from './config/database'
import { generalLimiter, errorHandler } from './middleware'
import { authRoutes, userRoutes, chatRoutes, chatMessageRoutes } from './routes'

config()

const app = express()
const PORT = parseInt(process.env.PORT || '5001')
const NODE_ENV = process.env.NODE_ENV || 'development'
const AI_MODE = process.env.DEMO_MODE === 'true' ? 'Demo Mode' : 'Groq AI'

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(generalLimiter)

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: AI_MODE,
    port: PORT,
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/chat', chatMessageRoutes)

app.use(errorHandler)

async function startServer() {
  try {
    await connectDB()

    app.listen(PORT, () => {
      const baseUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
      console.log(`🚀 Server running on: ${baseUrl}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app
