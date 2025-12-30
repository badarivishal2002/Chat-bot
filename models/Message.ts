import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema({
  chat_id: {
    type: String,
    required: true,
    index: true
  },
  user_id: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  sources: [{
    chunk_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chunk' },
    document_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    document_name: String,
    document_url: String,
    similarity: Number,
    text_snippet: String
  }],
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  edited: {
    type: Boolean,
    default: false
  },
  edited_at: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound indexes for efficient querying
messageSchema.index({ chat_id: 1, timestamp: -1 }) // For getting messages by chat in reverse chronological order
messageSchema.index({ user_id: 1, timestamp: -1 }) // For getting user's messages across all chats
messageSchema.index({ chat_id: 1, user_id: 1, timestamp: -1 }) // Most specific query

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema)

export default Message
