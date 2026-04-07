import mongoose from 'mongoose'

let isConnected = false

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log('✅ MongoDB already connected')
    return
  }

  let MONGODB_URI = process.env.MONGODB_URI
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables')
    process.exit(1)
  }

  console.log('🔄 Connecting to MongoDB Atlas...')
  const displayUri = MONGODB_URI.replace(/\/\/.*@/, '//***@')
  console.log('URI:', displayUri)

  try {
    const connection = await mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })

    isConnected = true
    console.log(`✅ MongoDB connected: ${connection.connection.host}`)
    console.log('✅ Database:', connection.connection.name)
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message)
    process.exit(1)
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) return
  await mongoose.disconnect()
  isConnected = false
}

mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error)
})

mongoose.connection.on('disconnected', () => {
  isConnected = false
  console.log('MongoDB disconnected')
})
