import mongoose from 'mongoose'

const chatSchema = new mongoose.Schema({
  chat_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    default: 'New Chat'
  },
  project_id: {
    type: String,
    default: null,
    index: true
  },
  // Secure sharing fields
  isShared: {
    type: Boolean,
    default: false
  },
  shareToken: {
    type: String,
    unique: true,
    sparse: true, // Only create index for non-null values
    default: null
  },
  sharedAt: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

chatSchema.index({ user_id: 1, chat_id: 1 })

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema)

export default Chat